import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  deleteDataset as deleteDatasetOnServer,
  clearDataset as clearDatasetOnServer,
  fetchAnalyticsBootstrap,
  switchDataset as switchDatasetOnServer,
  uploadDatasetFile,
} from "../services/analyticsApi";
import {
  DATE_RANGE_OPTIONS,
  KPI_ICON_MAP,
  REPORT_LIBRARY,
} from "../data/dashboardData";

const AnalyticsContext = createContext(null);

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const average = (items, selector) => {
  if (!items.length) return 0;
  return items.reduce((sum, item) => sum + selector(item), 0) / items.length;
};

const percent = (value) => `${value.toFixed(1)}%`;

const currency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

const compactCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);

const number = (value, maximumFractionDigits = 0) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);

const getDateRangeConfig = (dateRange) =>
  DATE_RANGE_OPTIONS.find((option) => option.value === dateRange) || DATE_RANGE_OPTIONS[1];

const getDateRangeDays = (dateRange) => {
  const parsed = Number(String(dateRange).replace(/[^0-9]/g, ""));
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 90;
};

const getMonthLabels = (count) => {
  const labels = [];
  const now = new Date();

  for (let index = count - 1; index >= 0; index -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    labels.push(
      monthDate.toLocaleDateString("en-US", {
        month: "short",
      })
    );
  }

  return labels;
};

const buildTrailingMonthBuckets = (count) => {
  const buckets = [];
  const now = new Date();

  for (let index = count - 1; index >= 0; index -= 1) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - index, 1);
    buckets.push({
      key: `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}`,
      label: monthDate.toLocaleDateString("en-US", { month: "short" }),
    });
  }

  return buckets;
};

const getMonthBucketKey = (value) => {
  const date = new Date(value || "");
  if (Number.isNaN(date.getTime())) return null;

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const isWithinDateRange = (value, cutoffTimestamp) => {
  const recordTime = new Date(value || "").getTime();
  return Number.isFinite(recordTime) ? recordTime >= cutoffTimestamp : true;
};

const matchesKeyword = (record, fields, keyword) => {
  if (!keyword) return true;

  return fields.some((field) =>
    String(record?.[field] ?? "")
      .trim()
      .toLowerCase()
      .includes(keyword)
  );
};

const allocateByWeight = (items, total, getWeight, mapResult) => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const normalizedTotal = Math.max(0, Math.round(total || 0));
  const weightedTotal = items.reduce((sum, item) => sum + Math.max(0, getWeight(item)), 0);
  let allocated = 0;

  return items.map((item, index) => {
    const value =
      index === items.length - 1
        ? Math.max(0, normalizedTotal - allocated)
        : Math.floor(
            (normalizedTotal * Math.max(0, getWeight(item))) / Math.max(weightedTotal, 1)
          );

    allocated += value;
    return mapResult(item, value);
  });
};

const MARKETING_CHANNEL_BLUEPRINTS = [
  { channel: "Organic Search", leadWeight: 1.26, ctrBoost: 0.34 },
  { channel: "Paid Search", leadWeight: 1.08, ctrBoost: 0.2 },
  { channel: "Social Media", leadWeight: 0.98, ctrBoost: 0.26 },
  { channel: "Email", leadWeight: 0.84, ctrBoost: 0.22 },
  { channel: "Referral", leadWeight: 0.62, ctrBoost: 0.12 },
];

const MARKETING_CAMPAIGN_BLUEPRINTS = [
  { campaign: "Brand Awareness", revenueWeight: 1.04 },
  { campaign: "Demand Generation", revenueWeight: 1.32 },
  { campaign: "Retention Email", revenueWeight: 0.94 },
  { campaign: "Partner Expansion", revenueWeight: 0.88 },
];

const MARKETING_TREND_MODIFIERS = [0.82, 0.9, 0.97, 1.04, 1.11, 1.18, 1.08, 1.14, 1.21, 1.12, 1.18, 1.25];

const buildTrend = (current, baseline, options = {}) => {
  const { inverse = false } = options;

  if (!Number.isFinite(current) || !Number.isFinite(baseline) || baseline === 0) {
    return {
      change: "0.0%",
      positive: true,
      comparison: "vs baseline",
    };
  }

  const rawChange = ((current - baseline) / baseline) * 100;
  const positive = inverse ? rawChange <= 0 : rawChange >= 0;

  return {
    change: `${rawChange >= 0 ? "+" : ""}${rawChange.toFixed(1)}%`,
    positive,
    comparison: "vs previous period",
  };
};

const EMPTY_META = {
  datasetId: null,
  fileName: "No dataset uploaded",
  uploadedAt: new Date().toISOString(),
  recordCount: 0,
  source: "empty",
  validationMessages: [],
  isActive: false,
  sheetCounts: {
    hrEmployees: 0,
    sales: 0,
    marketing: 0,
    finance: 0,
    operations: 0,
    total: 0,
  },
};

export function AnalyticsProvider({ children }) {
  const [employees, setEmployees] = useState([]);
  const [salesRecords, setSalesRecords] = useState([]);
  const [marketingRecords, setMarketingRecords] = useState([]);
  const [financeRecords, setFinanceRecords] = useState([]);
  const [operationsRecords, setOperationsRecords] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [activeDatasetId, setActiveDatasetId] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [validationMessages, setValidationMessages] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [dateRange, setDateRange] = useState(DATE_RANGE_OPTIONS[1].value);
  const [searchQuery, setSearchQuery] = useState("");
  const [isImportingDataset, setIsImportingDataset] = useState(false);
  const [isBootstrapLoading, setIsBootstrapLoading] = useState(true);
  const [datasetMeta, setDatasetMeta] = useState(EMPTY_META);

  const applyDatasetPayload = useCallback((payload) => {
    const nextEmployees = payload?.employees || [];
    const nextMeta = payload?.datasetMeta || EMPTY_META;

    setEmployees(nextEmployees);
    setSalesRecords(payload?.salesRecords || []);
    setMarketingRecords(payload?.marketingRecords || []);
    setFinanceRecords(payload?.financeRecords || []);
    setOperationsRecords(payload?.operationsRecords || []);
    setPreviewRows(payload?.previewRows || []);
    setDatasetMeta(nextMeta);
    setValidationMessages(payload?.validationMessages || payload?.issues || []);
    setDatasets(payload?.datasets || []);
    setActiveDatasetId(payload?.activeDatasetId || nextMeta.datasetId || null);

    return nextEmployees;
  }, []);

  const loadFromServer = useCallback(async () => {
    setIsBootstrapLoading(true);

    try {
      const payload = await fetchAnalyticsBootstrap();
      return applyDatasetPayload(payload);
    } catch (error) {
      setValidationMessages([error.message || "Unable to load dataset from backend."]);
      setEmployees([]);
      setSalesRecords([]);
      setMarketingRecords([]);
      setFinanceRecords([]);
      setOperationsRecords([]);
      setDatasets([]);
      setActiveDatasetId(null);
      setPreviewRows([]);
      setDatasetMeta(EMPTY_META);
      return [];
    } finally {
      setIsBootstrapLoading(false);
    }
  }, [applyDatasetPayload]);

  useEffect(() => {
    loadFromServer();
  }, [loadFromServer]);

  const availableDepartments = useMemo(() => {
    const departments = Array.from(
      new Set(
        [
          ...employees.map((employee) => employee.department),
          ...salesRecords.map((record) => record.department),
          ...financeRecords.map((record) => record.department),
          ...operationsRecords.map((record) => record.department),
        ].filter(Boolean)
      )
    ).sort((left, right) => left.localeCompare(right));

    return ["All Departments", ...departments];
  }, [employees, financeRecords, operationsRecords, salesRecords]);

  useEffect(() => {
    if (!availableDepartments.includes(departmentFilter)) {
      setDepartmentFilter("All Departments");
    }
  }, [availableDepartments, departmentFilter]);

  const filteredEmployees = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const cutoffTimestamp = Date.now() - getDateRangeDays(dateRange) * DAY_IN_MS;

    return employees.filter((employee) => {
      const matchesDepartment =
        departmentFilter === "All Departments" || employee.department === departmentFilter;

      if (!matchesDepartment) {
        return false;
      }

      if (!isWithinDateRange(employee.recordDate, cutoffTimestamp)) {
        return false;
      }

      return matchesKeyword(employee, ["employeeId", "department", "jobRole"], keyword);
    });
  }, [dateRange, departmentFilter, employees, searchQuery]);

  const filteredSalesRecords = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const cutoffTimestamp = Date.now() - getDateRangeDays(dateRange) * DAY_IN_MS;

    return salesRecords.filter((record) => {
      const matchesDepartment =
        departmentFilter === "All Departments" || record.department === departmentFilter;

      if (!matchesDepartment || !isWithinDateRange(record.salesDate, cutoffTimestamp)) {
        return false;
      }

      return matchesKeyword(
        record,
        ["department", "region", "salesChannel", "productCategory", "salesRep"],
        keyword
      );
    });
  }, [dateRange, departmentFilter, salesRecords, searchQuery]);

  const filteredMarketingRecords = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const cutoffTimestamp = Date.now() - getDateRangeDays(dateRange) * DAY_IN_MS;

    return marketingRecords.filter((record) => {
      if (!isWithinDateRange(record.marketingDate, cutoffTimestamp)) {
        return false;
      }

      return matchesKeyword(record, ["channel", "campaign"], keyword);
    });
  }, [dateRange, marketingRecords, searchQuery]);

  const filteredFinanceRecords = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const cutoffTimestamp = Date.now() - getDateRangeDays(dateRange) * DAY_IN_MS;

    return financeRecords.filter((record) => {
      const matchesDepartment =
        departmentFilter === "All Departments" || record.department === departmentFilter;

      if (!matchesDepartment || !isWithinDateRange(record.financeDate, cutoffTimestamp)) {
        return false;
      }

      return matchesKeyword(record, ["department"], keyword);
    });
  }, [dateRange, departmentFilter, financeRecords, searchQuery]);

  const filteredOperationsRecords = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();
    const cutoffTimestamp = Date.now() - getDateRangeDays(dateRange) * DAY_IN_MS;

    return operationsRecords.filter((record) => {
      const matchesDepartment =
        departmentFilter === "All Departments" || record.department === departmentFilter;

      if (!matchesDepartment || !isWithinDateRange(record.operationsDate, cutoffTimestamp)) {
        return false;
      }

      return matchesKeyword(record, ["department", "processName", "shift"], keyword);
    });
  }, [dateRange, departmentFilter, operationsRecords, searchQuery]);

  const baselineMetrics = useMemo(
    () => ({
      totalEmployees: employees.length,
      attritionRate:
        employees.length === 0
          ? 0
          : (employees.filter((employee) => employee.attrition).length / employees.length) * 100,
      averageSalary: average(employees, (employee) => employee.monthlyIncome),
      averageJobSatisfaction: average(employees, (employee) => employee.jobSatisfaction),
      averagePerformanceRating: average(employees, (employee) => employee.performanceRating),
      averageWorkLifeBalance: average(employees, (employee) => employee.workLifeBalance),
    }),
    [employees]
  );

  const currentMetrics = useMemo(
    () => ({
      totalEmployees: filteredEmployees.length,
      attritionRate:
        filteredEmployees.length === 0
          ? 0
          : (filteredEmployees.filter((employee) => employee.attrition).length /
              filteredEmployees.length) *
            100,
      averageSalary: average(filteredEmployees, (employee) => employee.monthlyIncome),
      averageJobSatisfaction: average(filteredEmployees, (employee) => employee.jobSatisfaction),
      averagePerformanceRating: average(filteredEmployees, (employee) => employee.performanceRating),
      averageWorkLifeBalance: average(filteredEmployees, (employee) => employee.workLifeBalance),
    }),
    [filteredEmployees]
  );

  const kpiCards = useMemo(() => {
    const totalEmployeeTrend = buildTrend(
      currentMetrics.totalEmployees,
      baselineMetrics.totalEmployees || currentMetrics.totalEmployees || 1
    );
    const attritionTrend = buildTrend(currentMetrics.attritionRate, baselineMetrics.attritionRate || 1, {
      inverse: true,
    });
    const salaryTrend = buildTrend(currentMetrics.averageSalary, baselineMetrics.averageSalary || 1);
    const satisfactionTrend = buildTrend(
      currentMetrics.averageJobSatisfaction,
      baselineMetrics.averageJobSatisfaction || 1
    );
    const performanceTrend = buildTrend(
      currentMetrics.averagePerformanceRating,
      baselineMetrics.averagePerformanceRating || 1
    );
    const workLifeTrend = buildTrend(
      currentMetrics.averageWorkLifeBalance,
      baselineMetrics.averageWorkLifeBalance || 1
    );

    return [
      {
        key: "totalEmployees",
        title: "Total Employees",
        value: number(currentMetrics.totalEmployees),
        icon: KPI_ICON_MAP.totalEmployees,
        trend: totalEmployeeTrend.change,
        trendPositive: totalEmployeeTrend.positive,
        comparison: totalEmployeeTrend.comparison,
      },
      {
        key: "attritionRate",
        title: "Attrition Rate",
        value: percent(currentMetrics.attritionRate),
        icon: KPI_ICON_MAP.attritionRate,
        trend: attritionTrend.change,
        trendPositive: attritionTrend.positive,
        comparison: attritionTrend.comparison,
      },
      {
        key: "averageSalary",
        title: "Average Salary",
        value: currency(currentMetrics.averageSalary),
        icon: KPI_ICON_MAP.averageSalary,
        trend: salaryTrend.change,
        trendPositive: salaryTrend.positive,
        comparison: salaryTrend.comparison,
      },
      {
        key: "averageJobSatisfaction",
        title: "Average Job Satisfaction",
        value: currentMetrics.averageJobSatisfaction.toFixed(2),
        icon: KPI_ICON_MAP.averageJobSatisfaction,
        trend: satisfactionTrend.change,
        trendPositive: satisfactionTrend.positive,
        comparison: satisfactionTrend.comparison,
      },
      {
        key: "averagePerformanceRating",
        title: "Average Performance Rating",
        value: currentMetrics.averagePerformanceRating.toFixed(2),
        icon: KPI_ICON_MAP.averagePerformanceRating,
        trend: performanceTrend.change,
        trendPositive: performanceTrend.positive,
        comparison: performanceTrend.comparison,
      },
      {
        key: "averageWorkLifeBalance",
        title: "Average Work-Life Balance",
        value: currentMetrics.averageWorkLifeBalance.toFixed(2),
        icon: KPI_ICON_MAP.averageWorkLifeBalance,
        trend: workLifeTrend.change,
        trendPositive: workLifeTrend.positive,
        comparison: workLifeTrend.comparison,
      },
    ];
  }, [baselineMetrics, currentMetrics]);

  const departmentDistribution = useMemo(() => {
    const grouped = new Map();

    filteredEmployees.forEach((employee) => {
      grouped.set(employee.department, (grouped.get(employee.department) || 0) + 1);
    });

    return Array.from(grouped.entries()).map(([department, count]) => ({
      department,
      count,
    }));
  }, [filteredEmployees]);

  const attritionByDepartment = useMemo(() => {
    const grouped = new Map();

    filteredEmployees.forEach((employee) => {
      if (!grouped.has(employee.department)) {
        grouped.set(employee.department, { department: employee.department, attritionCount: 0, total: 0 });
      }

      const bucket = grouped.get(employee.department);
      bucket.total += 1;
      if (employee.attrition) {
        bucket.attritionCount += 1;
      }
    });

    return Array.from(grouped.values()).map((bucket) => ({
      department: bucket.department,
      attritionCount: bucket.attritionCount,
      attritionRate: bucket.total === 0 ? 0 : Number(((bucket.attritionCount / bucket.total) * 100).toFixed(1)),
      totalEmployees: bucket.total,
    }));
  }, [filteredEmployees]);

  const ageDistribution = useMemo(() => {
    const bins = [
      { label: "18-24", min: 18, max: 24 },
      { label: "25-34", min: 25, max: 34 },
      { label: "35-44", min: 35, max: 44 },
      { label: "45-54", min: 45, max: 54 },
      { label: "55+", min: 55, max: 99 },
    ];

    return bins.map((bin) => ({
      ageGroup: bin.label,
      employees: filteredEmployees.filter((employee) => employee.age >= bin.min && employee.age <= bin.max)
        .length,
    }));
  }, [filteredEmployees]);

  const salaryDistribution = useMemo(() => {
    const bands = [
      { label: "<4K", min: 0, max: 3999 },
      { label: "4K-6K", min: 4000, max: 5999 },
      { label: "6K-8K", min: 6000, max: 7999 },
      { label: "8K-10K", min: 8000, max: 9999 },
      { label: "10K+", min: 10000, max: Number.POSITIVE_INFINITY },
    ];

    return bands.map((band) => ({
      range: band.label,
      employees: filteredEmployees.filter(
        (employee) => employee.monthlyIncome >= band.min && employee.monthlyIncome <= band.max
      ).length,
    }));
  }, [filteredEmployees]);

  const experienceVsPerformance = useMemo(
    () =>
      filteredEmployees.map((employee) => ({
        employeeId: employee.employeeId,
        department: employee.department,
        yearsExperience: employee.yearsExperience,
        performanceRating: employee.performanceRating,
        monthlyIncome: employee.monthlyIncome,
      })),
    [filteredEmployees]
  );

  const performanceRatingDistribution = useMemo(() => {
    const ratingBuckets = [1, 2, 3, 4, 5];

    return ratingBuckets.map((rating) => ({
      rating: String(rating),
      employees: filteredEmployees.filter(
        (employee) => Math.round(employee.performanceRating) === rating
      ).length,
    }));
  }, [filteredEmployees]);

  const jobSatisfactionLevels = useMemo(() => {
    const buckets = [1, 2, 3, 4, 5];

    return buckets.map((score) => ({
      score: String(score),
      employees: filteredEmployees.filter(
        (employee) => Math.round(employee.jobSatisfaction) === score
      ).length,
    }));
  }, [filteredEmployees]);

  const workLifeBalanceLevels = useMemo(() => {
    const buckets = [1, 2, 3, 4, 5];

    return buckets.map((score) => ({
      score: String(score),
      employees: filteredEmployees.filter(
        (employee) => Math.round(employee.workLifeBalance) === score
      ).length,
    }));
  }, [filteredEmployees]);

  const departmentPerformanceComparison = useMemo(() => {
    const grouped = new Map();

    filteredEmployees.forEach((employee) => {
      if (!grouped.has(employee.department)) {
        grouped.set(employee.department, []);
      }
      grouped.get(employee.department).push(employee);
    });

    return Array.from(grouped.entries())
      .map(([department, members]) => {
        const avgPerformance = average(members, (member) => member.performanceRating);
        const avgSatisfaction = average(members, (member) => member.jobSatisfaction);
        const avgWorkLife = average(members, (member) => member.workLifeBalance);

        return {
          department,
          headcount: members.length,
          performance: Number(avgPerformance.toFixed(2)),
          satisfaction: Number(avgSatisfaction.toFixed(2)),
          workLifeBalance: Number(avgWorkLife.toFixed(2)),
          productivity: Number((avgPerformance * 20).toFixed(1)),
        };
      })
      .sort((left, right) => right.productivity - left.productivity);
  }, [filteredEmployees]);

  const radarPerformanceIndicators = useMemo(() => {
    const attritionRate = currentMetrics.attritionRate;
    const compensationIndex =
      baselineMetrics.averageSalary === 0
        ? 50
        : Math.min(Math.max((currentMetrics.averageSalary / baselineMetrics.averageSalary) * 100, 0), 130);

    return [
      {
        metric: "Performance",
        score: Number((currentMetrics.averagePerformanceRating * 20).toFixed(1)),
      },
      {
        metric: "Satisfaction",
        score: Number((currentMetrics.averageJobSatisfaction * 20).toFixed(1)),
      },
      {
        metric: "Work-Life",
        score: Number((currentMetrics.averageWorkLifeBalance * 20).toFixed(1)),
      },
      {
        metric: "Retention",
        score: Number((100 - attritionRate).toFixed(1)),
      },
      {
        metric: "Compensation",
        score: Number(compensationIndex.toFixed(1)),
      },
    ];
  }, [baselineMetrics.averageSalary, currentMetrics]);

  const leaderboardRows = useMemo(() => {
    const sorted = [...filteredEmployees].sort((left, right) => {
      const leftScore = left.performanceRating * 0.5 + left.jobSatisfaction * 0.3 + left.workLifeBalance * 0.2;
      const rightScore =
        right.performanceRating * 0.5 + right.jobSatisfaction * 0.3 + right.workLifeBalance * 0.2;

      if (rightScore !== leftScore) {
        return rightScore - leftScore;
      }

      return right.monthlyIncome - left.monthlyIncome;
    });

    return sorted.slice(0, 12).map((employee) => ({
      employeeId: employee.employeeId,
      jobRole: employee.jobRole,
      department: employee.department,
      performanceRating: employee.performanceRating,
      jobSatisfaction: employee.jobSatisfaction,
    }));
  }, [filteredEmployees]);

  const activeDateRange = useMemo(() => getDateRangeConfig(dateRange), [dateRange]);
  const hasRealSalesData = salesRecords.length > 0;
  const hasRealMarketingData = marketingRecords.length > 0;
  const hasRealFinanceData = financeRecords.length > 0;

  const salesByDepartment = useMemo(() => {
    if (hasRealSalesData) {
      const grouped = new Map();

      filteredSalesRecords.forEach((record) => {
        if (!grouped.has(record.department)) {
          grouped.set(record.department, { department: record.department, revenue: 0, headcount: 0 });
        }

        const bucket = grouped.get(record.department);
        bucket.revenue += Number(record.revenue || 0);
        bucket.headcount += 1;
      });

      return Array.from(grouped.values())
        .map((item) => ({
          department: item.department,
          revenue: Math.round(item.revenue),
          headcount: item.headcount,
        }))
        .sort((left, right) => right.revenue - left.revenue);
    }

    const grouped = new Map();

    filteredEmployees.forEach((employee) => {
      if (!grouped.has(employee.department)) {
        grouped.set(employee.department, []);
      }
      grouped.get(employee.department).push(employee);
    });

    return Array.from(grouped.entries())
      .map(([department, members]) => {
        const averageIncome = average(members, (member) => member.monthlyIncome);
        const averagePerformance = average(members, (member) => member.performanceRating);
        const annualRevenue = members.length * averageIncome * (1.1 + averagePerformance / 5) * 12;

        return {
          department,
          revenue: Math.round(annualRevenue),
          headcount: members.length,
        };
      })
      .sort((left, right) => right.revenue - left.revenue);
  }, [filteredEmployees, filteredSalesRecords, hasRealSalesData]);

  const totalSalesRevenue = useMemo(
    () => salesByDepartment.reduce((sum, item) => sum + item.revenue, 0),
    [salesByDepartment]
  );

  const monthlyRevenueTrend = useMemo(() => {
    if (hasRealSalesData) {
      const buckets = buildTrailingMonthBuckets(activeDateRange.months);
      const grouped = new Map(
        buckets.map((bucket) => [
          bucket.key,
          {
            month: bucket.label,
            revenue: 0,
            target: 0,
          },
        ])
      );

      filteredSalesRecords.forEach((record) => {
        const bucketKey = getMonthBucketKey(record.salesDate);
        if (!bucketKey || !grouped.has(bucketKey)) {
          return;
        }

        const bucket = grouped.get(bucketKey);
        bucket.revenue += Number(record.revenue || 0);
        bucket.target += Number(record.target || 0);
      });

      return buckets.map((bucket) => ({
        month: bucket.label,
        revenue: Math.round(grouped.get(bucket.key)?.revenue || 0),
        target: Math.round(grouped.get(bucket.key)?.target || 0),
      }));
    }

    const monthLabels = getMonthLabels(activeDateRange.months);
    const modifiers = [0.84, 0.9, 0.97, 1.04, 1.09, 1.13, 1.06, 1.11, 1.17, 1.08, 1.15, 1.2];
    const baseMonthlyRevenue = totalSalesRevenue / 12;

    return monthLabels.map((month, index) => {
      const modifier = modifiers[index % modifiers.length];
      const revenue = Math.round(baseMonthlyRevenue * modifier);

      return {
        month,
        revenue,
        target: Math.round(revenue * 1.08),
      };
    });
  }, [activeDateRange.months, filteredSalesRecords, hasRealSalesData, totalSalesRevenue]);

  const revenueContribution = useMemo(
    () =>
      salesByDepartment.map((item) => ({
        department: item.department,
        revenue: item.revenue,
      })),
    [salesByDepartment]
  );

  const marketingExecution = useMemo(() => {
    const totals = filteredEmployees.reduce(
      (summary, employee) => ({
        tasksAssigned: summary.tasksAssigned + Number(employee.tasksAssigned || 0),
        tasksCompleted: summary.tasksCompleted + Number(employee.tasksCompleted || 0),
        goalAchievementPct: summary.goalAchievementPct + Number(employee.goalAchievementPct || 0),
        qualityScore: summary.qualityScore + Number(employee.qualityScore || 0),
        revenueGenerated: summary.revenueGenerated + Number(employee.revenueGenerated || 0),
      }),
      {
        tasksAssigned: 0,
        tasksCompleted: 0,
        goalAchievementPct: 0,
        qualityScore: 0,
        revenueGenerated: 0,
      }
    );

    const headcount = Math.max(filteredEmployees.length, 1);
    const averageGoalAchievement =
      totals.goalAchievementPct > 0
        ? totals.goalAchievementPct / headcount
        : currentMetrics.averagePerformanceRating * 19;
    const averageQualityScore =
      totals.qualityScore > 0
        ? totals.qualityScore / headcount
        : currentMetrics.averageJobSatisfaction * 18;
    const completionRate =
      totals.tasksAssigned > 0
        ? clamp((totals.tasksCompleted / Math.max(totals.tasksAssigned, 1)) * 100, 0, 100)
        : clamp(
            currentMetrics.averagePerformanceRating * 18 +
              currentMetrics.averageWorkLifeBalance * 6,
            0,
            100
          );
    const attributedRevenue =
      totals.revenueGenerated > 0
        ? Math.round(
            totals.revenueGenerated *
              clamp(0.22 + currentMetrics.averagePerformanceRating * 0.03, 0.18, 0.38)
          )
        : 0;

    return {
      completionRate: Number(completionRate.toFixed(1)),
      averageGoalAchievement: Number(averageGoalAchievement.toFixed(1)),
      averageQualityScore: Number(averageQualityScore.toFixed(1)),
      attributedRevenue,
    };
  }, [
    currentMetrics.averageJobSatisfaction,
    currentMetrics.averagePerformanceRating,
    currentMetrics.averageWorkLifeBalance,
    filteredEmployees,
  ]);

  const marketingTrend = useMemo(() => {
    if (hasRealMarketingData) {
      const buckets = buildTrailingMonthBuckets(activeDateRange.months);
      const grouped = new Map(
        buckets.map((bucket) => [
          bucket.key,
          {
            month: bucket.label,
            leads: 0,
            visitors: 0,
            clicks: 0,
            impressions: 0,
            ctr: 0,
          },
        ])
      );

      filteredMarketingRecords.forEach((record) => {
        const bucketKey = getMonthBucketKey(record.marketingDate);
        if (!bucketKey || !grouped.has(bucketKey)) {
          return;
        }

        const bucket = grouped.get(bucketKey);
        bucket.leads += Number(record.leads || 0);
        bucket.visitors += Number(record.visitors || 0);
        bucket.clicks += Number(record.clicks || 0);
        bucket.impressions += Number(record.impressions || 0);
      });

      return buckets.map((bucket) => {
        const monthBucket = grouped.get(bucket.key);
        const ctr =
          monthBucket.impressions === 0
            ? 0
            : Number(((monthBucket.clicks / monthBucket.impressions) * 100).toFixed(2));

        return {
          month: bucket.label,
          leads: Math.round(monthBucket.leads),
          visitors: Math.round(monthBucket.visitors),
          ctr,
        };
      });
    }

    const monthLabels = getMonthLabels(activeDateRange.months);

    if (!filteredEmployees.length) {
      return monthLabels.map((month) => ({
        month,
        leads: 0,
        visitors: 0,
        ctr: 0,
      }));
    }

    const attritionGuard = clamp(1 - currentMetrics.attritionRate / 220, 0.55, 1.1);
    const departmentReachFactor = 1 + Math.max(0, departmentDistribution.length - 1) * 0.06;
    const leadCapacity =
      filteredEmployees.length *
      (5.6 +
        marketingExecution.completionRate / 13 +
        marketingExecution.averageGoalAchievement / 18 +
        marketingExecution.averageQualityScore / 24) *
      attritionGuard *
      departmentReachFactor;
    const baseLeadsPerMonth = leadCapacity / Math.max(activeDateRange.months, 1);
    const visitorConversionRate = clamp(
      0.024 +
        marketingExecution.averageQualityScore / 1000 +
        marketingExecution.completionRate / 1700 +
        currentMetrics.averagePerformanceRating * 0.0028 -
        currentMetrics.attritionRate / 5000,
      0.024,
      0.088
    );

    return monthLabels.map((month, index) => {
      const modifier = MARKETING_TREND_MODIFIERS[index % MARKETING_TREND_MODIFIERS.length];
      const leads = Math.max(0, Math.round(baseLeadsPerMonth * modifier));
      const visitors = Math.max(
        leads,
        Math.round((leads / visitorConversionRate) * (0.95 + index * 0.01))
      );
      const ctr = Number(
        clamp(
          (leads / Math.max(visitors, 1)) * 100 * 0.78 +
            marketingExecution.averageQualityScore / 180 +
            MARKETING_CHANNEL_BLUEPRINTS[index % MARKETING_CHANNEL_BLUEPRINTS.length].ctrBoost,
          1.2,
          9.5
        ).toFixed(2)
      );

      return {
        month,
        leads,
        visitors,
        ctr,
      };
    });
  }, [
    activeDateRange.months,
    currentMetrics.attritionRate,
    currentMetrics.averagePerformanceRating,
    departmentDistribution.length,
    filteredEmployees.length,
    filteredMarketingRecords,
    hasRealMarketingData,
    marketingExecution.averageGoalAchievement,
    marketingExecution.averageQualityScore,
    marketingExecution.completionRate,
  ]);

  const totalLeads = useMemo(
    () => marketingTrend.reduce((sum, item) => sum + item.leads, 0),
    [marketingTrend]
  );

  const leadsByChannel = useMemo(() => {
    if (hasRealMarketingData) {
      const grouped = new Map();

      filteredMarketingRecords.forEach((record) => {
        grouped.set(record.channel, (grouped.get(record.channel) || 0) + Number(record.leads || 0));
      });

      return Array.from(grouped.entries())
        .map(([channel, leads]) => ({
          channel,
          leads: Math.round(leads),
        }))
        .sort((left, right) => right.leads - left.leads);
    }

    const allocatedChannels = allocateByWeight(
      MARKETING_CHANNEL_BLUEPRINTS,
      totalLeads,
      (item) => {
        const channelBias =
          item.channel === "Organic Search"
            ? currentMetrics.averagePerformanceRating * 0.08
            : item.channel === "Email"
              ? currentMetrics.averageWorkLifeBalance * 0.07
              : item.channel === "Referral"
                ? departmentDistribution.length * 0.1
                : currentMetrics.averageJobSatisfaction * 0.06;

        return item.leadWeight + channelBias + item.ctrBoost * 0.5;
      },
      (item, leads) => ({
        channel: item.channel,
        leads,
      })
    );

    return allocatedChannels.sort((left, right) => right.leads - left.leads);
  }, [
    currentMetrics.averageJobSatisfaction,
    currentMetrics.averagePerformanceRating,
    currentMetrics.averageWorkLifeBalance,
    departmentDistribution.length,
    filteredMarketingRecords,
    hasRealMarketingData,
    totalLeads,
  ]);

  const revenueByCampaign = useMemo(() => {
    if (hasRealMarketingData) {
      const grouped = new Map();

      filteredMarketingRecords.forEach((record) => {
        grouped.set(record.campaign, (grouped.get(record.campaign) || 0) + Number(record.revenue || 0));
      });

      return Array.from(grouped.entries())
        .map(([campaign, revenue]) => ({
          campaign,
          revenue: Math.round(revenue),
        }))
        .sort((left, right) => right.revenue - left.revenue);
    }

    const leadInfluence =
      totalLeads *
      (180 +
        marketingExecution.averageGoalAchievement * 1.6 +
        marketingExecution.averageQualityScore * 1.4);
    const executionInfluence =
      marketingExecution.attributedRevenue > 0
        ? marketingExecution.attributedRevenue
        : Math.round(
            filteredEmployees.length *
              (marketingExecution.completionRate * 31 +
                marketingExecution.averageQualityScore * 42 +
                marketingExecution.averageGoalAchievement * 36)
          );
    const modeledRevenue = Math.round(executionInfluence * 0.58 + leadInfluence * 0.42);

    const allocatedCampaigns = allocateByWeight(
      MARKETING_CAMPAIGN_BLUEPRINTS,
      modeledRevenue,
      (item) => {
        const campaignBias =
          item.campaign === "Demand Generation"
            ? currentMetrics.averagePerformanceRating * 0.1
            : item.campaign === "Retention Email"
              ? currentMetrics.averageWorkLifeBalance * 0.09
              : item.campaign === "Partner Expansion"
                ? departmentDistribution.length * 0.12
                : currentMetrics.averageJobSatisfaction * 0.08;

        return item.revenueWeight + campaignBias;
      },
      (item, revenue) => ({
        campaign: item.campaign,
        revenue,
      })
    );

    return allocatedCampaigns.sort((left, right) => right.revenue - left.revenue);
  }, [
    currentMetrics.averagePerformanceRating,
    currentMetrics.averageWorkLifeBalance,
    departmentDistribution.length,
    filteredEmployees.length,
    filteredMarketingRecords,
    hasRealMarketingData,
    marketingExecution.attributedRevenue,
    marketingExecution.averageGoalAchievement,
    marketingExecution.averageQualityScore,
    marketingExecution.completionRate,
    totalLeads,
  ]);

  const totalMarketingRevenue = useMemo(
    () => revenueByCampaign.reduce((sum, item) => sum + item.revenue, 0),
    [revenueByCampaign]
  );

  const marketingChannelReturn = useMemo(() => {
    if (hasRealMarketingData) {
      const grouped = new Map();

      filteredMarketingRecords.forEach((record) => {
        const channel = String(record.channel || "Unspecified").trim() || "Unspecified";
        if (!grouped.has(channel)) {
          grouped.set(channel, {
            channel,
            spend: 0,
            revenue: 0,
          });
        }

        const bucket = grouped.get(channel);
        bucket.spend += Number(record.spend || 0);
        bucket.revenue += Number(record.revenue || 0);
      });

      return Array.from(grouped.values())
        .map((item) => ({
          channel: item.channel,
          spend: Math.round(item.spend),
          revenue: Math.round(item.revenue),
          roiPct:
            item.spend === 0 ? 0 : Number((((item.revenue - item.spend) / item.spend) * 100).toFixed(1)),
        }))
        .sort((left, right) => right.revenue - left.revenue);
    }

    const spendMultipliers = [0.62, 0.54, 0.46, 0.39, 0.33];

    return leadsByChannel
      .map((item, index) => {
        const share = totalLeads === 0 ? 0 : item.leads / Math.max(totalLeads, 1);
        const revenue = Math.round(totalMarketingRevenue * share);
        const spend = Math.round(revenue * spendMultipliers[index % spendMultipliers.length]);

        return {
          channel: item.channel,
          spend,
          revenue,
          roiPct: spend === 0 ? 0 : Number((((revenue - spend) / spend) * 100).toFixed(1)),
        };
      })
      .sort((left, right) => right.revenue - left.revenue);
  }, [
    filteredMarketingRecords,
    hasRealMarketingData,
    leadsByChannel,
    totalLeads,
    totalMarketingRevenue,
  ]);

  const totalExpensesAnnual = useMemo(
    () => filteredEmployees.reduce((sum, employee) => sum + employee.monthlyIncome * 12 * 1.28, 0),
    [filteredEmployees]
  );

  const financeRevenueExpensesTrend = useMemo(() => {
    if (hasRealFinanceData) {
      const buckets = buildTrailingMonthBuckets(activeDateRange.months);
      const grouped = new Map(
        buckets.map((bucket) => [
          bucket.key,
          {
            month: bucket.label,
            revenue: 0,
            expenses: 0,
            profit: 0,
            profitMargin: 0,
          },
        ])
      );

      filteredFinanceRecords.forEach((record) => {
        const bucketKey = getMonthBucketKey(record.financeDate);
        if (!bucketKey || !grouped.has(bucketKey)) {
          return;
        }

        const bucket = grouped.get(bucketKey);
        bucket.revenue += Number(record.revenue || 0);
        bucket.expenses += Number(record.expenses || 0);
      });

      return buckets.map((bucket) => {
        const monthBucket = grouped.get(bucket.key);
        const profit = monthBucket.revenue - monthBucket.expenses;
        const profitMargin = monthBucket.revenue === 0 ? 0 : (profit / monthBucket.revenue) * 100;

        return {
          month: bucket.label,
          revenue: Math.round(monthBucket.revenue),
          expenses: Math.round(monthBucket.expenses),
          profit: Math.round(profit),
          profitMargin: Number(profitMargin.toFixed(1)),
        };
      });
    }

    const expenseModifiers = [0.94, 0.96, 0.99, 1.01, 1.04, 1.06, 1.05, 1.07, 1.08, 1.1, 1.12, 1.14];
    const baseMonthlyExpense = totalExpensesAnnual / 12;

    return monthlyRevenueTrend.map((monthData, index) => {
      const expenses = Math.round(baseMonthlyExpense * expenseModifiers[index % expenseModifiers.length]);
      const profit = monthData.revenue - expenses;
      const profitMargin = monthData.revenue === 0 ? 0 : (profit / monthData.revenue) * 100;

      return {
        month: monthData.month,
        revenue: monthData.revenue,
        expenses,
        profit,
        profitMargin: Number(profitMargin.toFixed(1)),
      };
    });
  }, [activeDateRange.months, filteredFinanceRecords, hasRealFinanceData, monthlyRevenueTrend, totalExpensesAnnual]);

  const budgetAllocationByDepartment = useMemo(() => {
    if (hasRealFinanceData) {
      const grouped = new Map();

      filteredFinanceRecords.forEach((record) => {
        if (!grouped.has(record.department)) {
          grouped.set(record.department, {
            department: record.department,
            personnelBudget: 0,
            trainingBudget: 0,
            operationsBudget: 0,
          });
        }

        const bucket = grouped.get(record.department);
        bucket.personnelBudget += Number(record.personnelBudget || 0);
        bucket.trainingBudget += Number(record.trainingBudget || 0);
        bucket.operationsBudget += Number(record.operationsBudget || 0);
      });

      return Array.from(grouped.values()).map((item) => ({
        department: item.department,
        personnelBudgetK: Number((item.personnelBudget / 1000).toFixed(1)),
        trainingBudgetK: Number((item.trainingBudget / 1000).toFixed(1)),
        operationsBudgetK: Number((item.operationsBudget / 1000).toFixed(1)),
        totalBudgetK: Number(
          ((item.personnelBudget + item.trainingBudget + item.operationsBudget) / 1000).toFixed(1)
        ),
      }));
    }

    return salesByDepartment.map((item) => {
      const personnelBudget = item.revenue * 0.36;
      const trainingBudget = item.revenue * 0.08;
      const operationsBudget = item.revenue * 0.16;

      return {
        department: item.department,
        personnelBudgetK: Number((personnelBudget / 1000).toFixed(1)),
        trainingBudgetK: Number((trainingBudget / 1000).toFixed(1)),
        operationsBudgetK: Number((operationsBudget / 1000).toFixed(1)),
        totalBudgetK: Number(((personnelBudget + trainingBudget + operationsBudget) / 1000).toFixed(1)),
      };
    });
  }, [filteredFinanceRecords, hasRealFinanceData, salesByDepartment]);

  const financeKpis = useMemo(() => {
    if (hasRealFinanceData) {
      const revenue = filteredFinanceRecords.reduce((sum, record) => sum + Number(record.revenue || 0), 0);
      const expenses = filteredFinanceRecords.reduce((sum, record) => sum + Number(record.expenses || 0), 0);
      const netProfit = revenue - expenses;
      const profitMargin = revenue === 0 ? 0 : (netProfit / revenue) * 100;

      return {
        revenue: Math.round(revenue),
        expenses: Math.round(expenses),
        netProfit: Math.round(netProfit),
        profitMargin,
      };
    }

    const netProfit = totalSalesRevenue - totalExpensesAnnual;
    const profitMargin = totalSalesRevenue === 0 ? 0 : (netProfit / totalSalesRevenue) * 100;

    return {
      revenue: totalSalesRevenue,
      expenses: totalExpensesAnnual,
      netProfit,
      profitMargin,
    };
  }, [filteredFinanceRecords, hasRealFinanceData, totalExpensesAnnual, totalSalesRevenue]);

  const operationsKpis = useMemo(() => {
    const totalUnitsProcessed = filteredOperationsRecords.reduce(
      (sum, record) => sum + Number(record.unitsProcessed || 0),
      0
    );
    const totalOperatingCost = filteredOperationsRecords.reduce(
      (sum, record) => sum + Number(record.operatingCost || 0),
      0
    );

    return {
      hasData: operationsRecords.length > 0,
      totalUnitsProcessed: Math.round(totalUnitsProcessed),
      totalOperatingCost: Math.round(totalOperatingCost),
      averageUtilizationPct: average(filteredOperationsRecords, (record) => record.utilizationPct),
      averageOnTimeDeliveryPct: average(filteredOperationsRecords, (record) => record.onTimeDeliveryPct),
      averageCycleTimeMinutes: average(filteredOperationsRecords, (record) => record.cycleTimeMinutes),
      totalBacklogVolume: Math.round(
        filteredOperationsRecords.reduce((sum, record) => sum + Number(record.backlogVolume || 0), 0)
      ),
    };
  }, [filteredOperationsRecords, operationsRecords.length]);

  const operationsTrend = useMemo(() => {
    const buckets = buildTrailingMonthBuckets(activeDateRange.months);
    const grouped = new Map(
      buckets.map((bucket) => [
        bucket.key,
        {
          month: bucket.label,
          unitsProcessed: 0,
          throughput: 0,
          downtimeMinutes: 0,
          operatingCost: 0,
        },
      ])
    );

    filteredOperationsRecords.forEach((record) => {
      const bucketKey = getMonthBucketKey(record.operationsDate);
      if (!bucketKey || !grouped.has(bucketKey)) {
        return;
      }

      const bucket = grouped.get(bucketKey);
      bucket.unitsProcessed += Number(record.unitsProcessed || 0);
      bucket.throughput += Number(record.throughput || 0);
      bucket.downtimeMinutes += Number(record.downtimeMinutes || 0);
      bucket.operatingCost += Number(record.operatingCost || 0);
    });

    return buckets.map((bucket) => ({
      month: bucket.label,
      unitsProcessed: Math.round(grouped.get(bucket.key)?.unitsProcessed || 0),
      throughput: Math.round(grouped.get(bucket.key)?.throughput || 0),
      downtimeMinutes: Math.round(grouped.get(bucket.key)?.downtimeMinutes || 0),
      operatingCost: Math.round(grouped.get(bucket.key)?.operatingCost || 0),
    }));
  }, [activeDateRange.months, filteredOperationsRecords]);

  const processUtilization = useMemo(() => {
    const grouped = new Map();

    filteredOperationsRecords.forEach((record) => {
      if (!grouped.has(record.processName)) {
        grouped.set(record.processName, {
          processName: record.processName,
          utilizationPct: 0,
          cycleTimeMinutes: 0,
          unitsProcessed: 0,
          count: 0,
        });
      }

      const bucket = grouped.get(record.processName);
      bucket.utilizationPct += Number(record.utilizationPct || 0);
      bucket.cycleTimeMinutes += Number(record.cycleTimeMinutes || 0);
      bucket.unitsProcessed += Number(record.unitsProcessed || 0);
      bucket.count += 1;
    });

    return Array.from(grouped.values())
      .map((item) => ({
        processName: item.processName,
        utilizationPct: Number((item.utilizationPct / Math.max(item.count, 1)).toFixed(1)),
        cycleTimeMinutes: Number((item.cycleTimeMinutes / Math.max(item.count, 1)).toFixed(1)),
        unitsProcessed: Math.round(item.unitsProcessed),
      }))
      .sort((left, right) => right.unitsProcessed - left.unitsProcessed);
  }, [filteredOperationsRecords]);

  const operationsQualityByDepartment = useMemo(() => {
    const grouped = new Map();

    filteredOperationsRecords.forEach((record) => {
      if (!grouped.has(record.department)) {
        grouped.set(record.department, {
          department: record.department,
          onTimeDeliveryPct: 0,
          slaCompliancePct: 0,
          defectRatePct: 0,
          count: 0,
        });
      }

      const bucket = grouped.get(record.department);
      bucket.onTimeDeliveryPct += Number(record.onTimeDeliveryPct || 0);
      bucket.slaCompliancePct += Number(record.slaCompliancePct || 0);
      bucket.defectRatePct += Number(record.defectRatePct || 0);
      bucket.count += 1;
    });

    return Array.from(grouped.values())
      .map((item) => ({
        department: item.department,
        onTimeDeliveryPct: Number((item.onTimeDeliveryPct / Math.max(item.count, 1)).toFixed(1)),
        slaCompliancePct: Number((item.slaCompliancePct / Math.max(item.count, 1)).toFixed(1)),
        defectRatePct: Number((item.defectRatePct / Math.max(item.count, 1)).toFixed(2)),
      }))
      .sort((left, right) => right.onTimeDeliveryPct - left.onTimeDeliveryPct);
  }, [filteredOperationsRecords]);

  const backlogInventoryTrend = useMemo(() => {
    const buckets = buildTrailingMonthBuckets(activeDateRange.months);
    const grouped = new Map(
      buckets.map((bucket) => [
        bucket.key,
        {
          month: bucket.label,
          backlogVolume: 0,
          inventoryLevel: 0,
        },
      ])
    );

    filteredOperationsRecords.forEach((record) => {
      const bucketKey = getMonthBucketKey(record.operationsDate);
      if (!bucketKey || !grouped.has(bucketKey)) {
        return;
      }

      const bucket = grouped.get(bucketKey);
      bucket.backlogVolume += Number(record.backlogVolume || 0);
      bucket.inventoryLevel += Number(record.inventoryLevel || 0);
    });

    return buckets.map((bucket) => ({
      month: bucket.label,
      backlogVolume: Math.round(grouped.get(bucket.key)?.backlogVolume || 0),
      inventoryLevel: Math.round(grouped.get(bucket.key)?.inventoryLevel || 0),
    }));
  }, [activeDateRange.months, filteredOperationsRecords]);

  const operationsProcessTable = useMemo(() => {
    const grouped = new Map();

    filteredOperationsRecords.forEach((record) => {
      const key = `${record.processName}::${record.shift || "All Shifts"}`;
      if (!grouped.has(key)) {
        grouped.set(key, {
          processName: record.processName,
          shift: record.shift || "All Shifts",
          unitsProcessed: 0,
          utilizationPct: 0,
          defectRatePct: 0,
          downtimeMinutes: 0,
          count: 0,
        });
      }

      const bucket = grouped.get(key);
      bucket.unitsProcessed += Number(record.unitsProcessed || 0);
      bucket.utilizationPct += Number(record.utilizationPct || 0);
      bucket.defectRatePct += Number(record.defectRatePct || 0);
      bucket.downtimeMinutes += Number(record.downtimeMinutes || 0);
      bucket.count += 1;
    });

    return Array.from(grouped.values())
      .map((item) => ({
        processName: item.processName,
        shift: item.shift,
        unitsProcessed: Math.round(item.unitsProcessed),
        utilizationPct: Number((item.utilizationPct / Math.max(item.count, 1)).toFixed(1)),
        defectRatePct: Number((item.defectRatePct / Math.max(item.count, 1)).toFixed(2)),
        downtimeMinutes: Math.round(item.downtimeMinutes),
      }))
      .sort((left, right) => right.unitsProcessed - left.unitsProcessed)
      .slice(0, 12);
  }, [filteredOperationsRecords]);

  const ppfFrontier = useMemo(() => {
    if (filteredEmployees.length === 0) {
      return {
        hasData: false,
        frontierData: [],
        operatingPoint: [],
        hrMax: 0,
        businessMax: 0,
      };
    }

    const hrCapacityMax = clamp(
      currentMetrics.averageWorkLifeBalance * 18 + (100 - currentMetrics.attritionRate) * 0.52,
      55,
      130
    );

    const businessCapacityMax = clamp(
      currentMetrics.averagePerformanceRating * 18 +
        currentMetrics.averageJobSatisfaction * 14 +
        (financeKpis.profitMargin > 0 ? financeKpis.profitMargin * 0.8 : 0),
      50,
      140
    );

    const frontierData = Array.from({ length: 11 }, (_, index) => {
      const hrCapability = Number(((hrCapacityMax / 10) * index).toFixed(1));
      const utilization = hrCapacityMax === 0 ? 0 : hrCapability / hrCapacityMax;
      const businessOutput = Number(
        Math.max(0, businessCapacityMax * (1 - Math.pow(utilization, 1.85))).toFixed(1)
      );

      return {
        hrCapability,
        businessOutput,
      };
    });

    const operatingHr = clamp(
      currentMetrics.averageWorkLifeBalance * 18 + (100 - currentMetrics.attritionRate) * 0.32,
      10,
      hrCapacityMax * 0.96
    );

    const frontierAtOperating =
      businessCapacityMax * (1 - Math.pow(operatingHr / hrCapacityMax, 1.85));

    const rawOperatingBusiness = clamp(
      (financeKpis.revenue <= 0
        ? 0
        : (financeKpis.netProfit / Math.max(financeKpis.revenue, 1)) * businessCapacityMax) +
        currentMetrics.averagePerformanceRating * 8 +
        currentMetrics.averageJobSatisfaction * 5,
      4,
      businessCapacityMax
    );

    const operatingPoint = [
      {
        name: "Current operating point",
        hrCapability: Number(operatingHr.toFixed(1)),
        businessOutput: Number(Math.min(rawOperatingBusiness, frontierAtOperating * 0.92).toFixed(1)),
      },
    ];

    return {
      hasData: true,
      frontierData,
      operatingPoint,
      hrMax: Number(hrCapacityMax.toFixed(1)),
      businessMax: Number(businessCapacityMax.toFixed(1)),
    };
  }, [
    filteredEmployees.length,
    currentMetrics.attritionRate,
    currentMetrics.averageJobSatisfaction,
    currentMetrics.averagePerformanceRating,
    currentMetrics.averageWorkLifeBalance,
    financeKpis.netProfit,
    financeKpis.profitMargin,
    financeKpis.revenue,
  ]);

  const reportsRows = useMemo(() => {
    const now = new Date();

    return REPORT_LIBRARY.map((report, index) => {
      const generatedAt = new Date(now.getTime() - index * 36 * 60 * 60 * 1000);

      return {
        id: report.id,
        reportName: report.name,
        description: report.description,
        records: filteredEmployees.length,
        generatedAt: generatedAt.toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: "Ready",
      };
    });
  }, [filteredEmployees.length]);

  const reportInsights = useMemo(() => {
    const topDepartment = departmentPerformanceComparison[0];

    return [
      `${number(currentMetrics.totalEmployees)} active employee records in current view.`,
      topDepartment
        ? `${topDepartment.department} leads with a productivity score of ${topDepartment.productivity.toFixed(
            1
          )}.`
        : "No department performance data is available.",
      `Current attrition rate is ${percent(currentMetrics.attritionRate)}, with salary average at ${currency(
        currentMetrics.averageSalary
      )}.`,
    ];
  }, [currentMetrics, departmentPerformanceComparison]);

  const importDataset = useCallback(async (file) => {
    if (!file) {
      return {
        success: false,
        issues: ["Select a CSV or Excel file before importing."],
        count: 0,
      };
    }

    setIsImportingDataset(true);

    try {
      const response = await uploadDatasetFile(file);
      applyDatasetPayload(response);
      setDepartmentFilter("All Departments");
      setSearchQuery("");
      setDateRange(DATE_RANGE_OPTIONS[1].value);

      return {
        success: true,
        issues: response.issues || response.validationMessages || [],
        count: response.count || (response.employees || []).length || 0,
      };
    } catch (error) {
      const issues = error?.payload?.issues || [error.message || "Dataset import failed."];
      if (Array.isArray(error?.payload?.previewRows)) {
        setPreviewRows(error.payload.previewRows);
      }
      setValidationMessages(issues);

      return {
        success: false,
        issues,
        count: 0,
      };
    } finally {
      setIsImportingDataset(false);
    }
  }, [applyDatasetPayload]);

  const clearDataset = useCallback(async () => {
    try {
      const payload = await clearDatasetOnServer();
      applyDatasetPayload(payload);
      setDepartmentFilter("All Departments");
      setSearchQuery("");
      return true;
    } catch (error) {
      setValidationMessages([error.message || "Failed to clear dataset."]);
      return false;
    }
  }, [applyDatasetPayload]);

  const switchDataset = useCallback(
    async (datasetId) => {
      const normalizedDatasetId = String(datasetId || "").trim();
      if (!normalizedDatasetId || normalizedDatasetId === activeDatasetId) {
        return true;
      }

      try {
        const payload = await switchDatasetOnServer(normalizedDatasetId);
        applyDatasetPayload(payload);
        setDepartmentFilter("All Departments");
        setSearchQuery("");
        return true;
      } catch (error) {
        setValidationMessages([error.message || "Failed to switch dataset."]);
        return false;
      }
    },
    [activeDatasetId, applyDatasetPayload]
  );

  const removeDataset = useCallback(
    async (datasetId) => {
      const normalizedDatasetId = String(datasetId || "").trim();
      if (!normalizedDatasetId) {
        return false;
      }

      try {
        const payload = await deleteDatasetOnServer(normalizedDatasetId);
        applyDatasetPayload(payload);
        setDepartmentFilter("All Departments");
        setSearchQuery("");
        return true;
      } catch (error) {
        setValidationMessages([error.message || "Failed to remove dataset."]);
        return false;
      }
    },
    [applyDatasetPayload]
  );

  const value = useMemo(
    () => ({
      employees,
      salesRecords,
      marketingRecords,
      financeRecords,
      operationsRecords,
      datasets,
      activeDatasetId,
      filteredEmployees,
      filteredOperationsRecords,
      availableDepartments,
      departmentFilter,
      setDepartmentFilter,
      dateRange,
      setDateRange,
      searchQuery,
      setSearchQuery,
      datasetMeta,
      previewRows,
      validationMessages,
      isImportingDataset,
      isBootstrapLoading,
      importDataset,
      clearDataset,
      switchDataset,
      removeDataset,
      refreshDataset: loadFromServer,
      activeDateRange,
      kpiCards,
      currentMetrics,
      departmentDistribution,
      attritionByDepartment,
      ageDistribution,
      salaryDistribution,
      experienceVsPerformance,
      performanceRatingDistribution,
      jobSatisfactionLevels,
      workLifeBalanceLevels,
      departmentPerformanceComparison,
      radarPerformanceIndicators,
      leaderboardRows,
      totalLeads,
      totalMarketingRevenue,
      marketingTrend,
      leadsByChannel,
      marketingChannelReturn,
      revenueByCampaign,
      totalSalesRevenue,
      monthlyRevenueTrend,
      salesByDepartment,
      revenueContribution,
      financeKpis,
      financeRevenueExpensesTrend,
      budgetAllocationByDepartment,
      operationsKpis,
      operationsTrend,
      processUtilization,
      operationsQualityByDepartment,
      backlogInventoryTrend,
      operationsProcessTable,
      ppfFrontier,
      reportsRows,
      reportInsights,
      formatters: {
        currency,
        compactCurrency,
        number,
        percent,
      },
    }),
    [
      employees,
      salesRecords,
      marketingRecords,
      financeRecords,
      operationsRecords,
      datasets,
      activeDatasetId,
      filteredEmployees,
      filteredOperationsRecords,
      availableDepartments,
      departmentFilter,
      dateRange,
      searchQuery,
      datasetMeta,
      previewRows,
      validationMessages,
      isImportingDataset,
      isBootstrapLoading,
      importDataset,
      clearDataset,
      switchDataset,
      removeDataset,
      loadFromServer,
      activeDateRange,
      kpiCards,
      currentMetrics,
      departmentDistribution,
      attritionByDepartment,
      ageDistribution,
      salaryDistribution,
      experienceVsPerformance,
      performanceRatingDistribution,
      jobSatisfactionLevels,
      workLifeBalanceLevels,
      departmentPerformanceComparison,
      radarPerformanceIndicators,
      leaderboardRows,
      totalLeads,
      totalMarketingRevenue,
      marketingTrend,
      leadsByChannel,
      marketingChannelReturn,
      revenueByCampaign,
      totalSalesRevenue,
      monthlyRevenueTrend,
      salesByDepartment,
      revenueContribution,
      financeKpis,
      financeRevenueExpensesTrend,
      budgetAllocationByDepartment,
      operationsKpis,
      operationsTrend,
      processUtilization,
      operationsQualityByDepartment,
      backlogInventoryTrend,
      operationsProcessTable,
      ppfFrontier,
      reportsRows,
      reportInsights,
    ]
  );

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);

  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }

  return context;
}
