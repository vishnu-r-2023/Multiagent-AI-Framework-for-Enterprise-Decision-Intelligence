import { useMemo, useState } from "react";
import ChartPanel from "../components/common/ChartPanel";
import { useAnalytics } from "../context/AnalyticsContext";
import { REPORT_LIBRARY } from "../data/dashboardData";

function ReportsPage() {
  const {
    departmentPerformanceComparison,
    attritionByDepartment,
    salaryDistribution,
    reportInsights,
    reportsRows,
    formatters,
  } = useAnalytics();

  const [selectedReportId, setSelectedReportId] = useState(REPORT_LIBRARY[0].id);

  const activeReportRows = useMemo(() => {
    if (selectedReportId === "department-performance") {
      return departmentPerformanceComparison.map((item) => ({
        Department: item.department,
        Headcount: item.headcount,
        ProductivityScore: item.productivity,
        AvgPerformance: item.performance,
        AvgSatisfaction: item.satisfaction,
      }));
    }

    if (selectedReportId === "employee-retention") {
      return attritionByDepartment.map((item) => ({
        Department: item.department,
        Employees: item.totalEmployees,
        AttritionCount: item.attritionCount,
        AttritionRate: `${item.attritionRate}%`,
      }));
    }

    return salaryDistribution.map((item) => ({
      SalaryBand: item.range,
      EmployeeCount: item.employees,
    }));
  }, [attritionByDepartment, departmentPerformanceComparison, salaryDistribution, selectedReportId]);

  const selectedReport = useMemo(
    () => REPORT_LIBRARY.find((report) => report.id === selectedReportId) || REPORT_LIBRARY[0],
    [selectedReportId]
  );

  const handleExportExcel = async () => {
    const excelModule = await import("write-excel-file");
    const writeXlsxFile = excelModule.default || excelModule;
    const headers = Object.keys(activeReportRows[0] || { Metric: "" });
    const rows = [
      headers.map((header) => ({ value: header })),
      ...activeReportRows.map((row) => headers.map((header) => ({ value: row[header] ?? "" }))),
    ];

    await writeXlsxFile(rows, {
      fileName: `${selectedReport.id}-report.xlsx`,
      sheet: "Report",
    });
  };

  const handleExportPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF();

    doc.setFontSize(15);
    doc.text(selectedReport.name, 14, 18);
    doc.setFontSize(10);
    doc.text(selectedReport.description, 14, 26);

    let cursorY = 36;
    const rowsToPrint = activeReportRows.slice(0, 18);

    rowsToPrint.forEach((row, index) => {
      if (cursorY > 270) {
        doc.addPage();
        cursorY = 20;
      }

      doc.text(`${index + 1}. ${Object.entries(row)
        .map(([key, value]) => `${key}: ${value}`)
        .join(" | ")}`, 14, cursorY);
      cursorY += 8;
    });

    doc.save(`${selectedReport.id}-report.pdf`);
  };

  return (
    <div className="mx-auto max-w-[1700px] space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {REPORT_LIBRARY.map((report) => (
          <button
            key={report.id}
            type="button"
            onClick={() => setSelectedReportId(report.id)}
            className={`rounded-2xl border p-4 text-left shadow-sm transition ${
              selectedReportId === report.id
                ? "border-blue-400 bg-blue-50"
                : "border-slate-200 bg-white hover:border-blue-300"
            }`}
          >
            <p className="text-sm font-semibold text-slate-900">{report.name}</p>
            <p className="mt-2 text-sm text-slate-600">{report.description}</p>
          </button>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <ChartPanel
          title={selectedReport.name}
          subtitle="Structured report output in table format"
          actions={
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportPdf}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400"
              >
                Export PDF
              </button>
              <button
                type="button"
                onClick={handleExportExcel}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Export Excel
              </button>
            </div>
          }
        >
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                  {Object.keys(activeReportRows[0] || { Metric: "" }).map((header) => (
                    <th key={header} className="px-3 py-3 font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeReportRows.map((row, index) => (
                  <tr key={`${selectedReport.id}-${index}`} className="border-b border-slate-100 text-sm text-slate-700">
                    {Object.entries(row).map(([key, value]) => (
                      <td key={key} className="px-3 py-3">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartPanel>

        <ChartPanel title="Summary Insights" subtitle="Plain-language findings for HR managers">
          <ul className="space-y-3">
            {reportInsights.map((insight) => (
              <li key={insight} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                {insight}
              </li>
            ))}
          </ul>

          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            <p className="font-semibold text-slate-800">Report Snapshot</p>
            <p className="mt-2">Records in current report: {formatters.number(activeReportRows.length)}</p>
            <p className="mt-1">Generated templates available: {formatters.number(reportsRows.length)}</p>
          </div>
        </ChartPanel>
      </section>

      <section>
        <ChartPanel title="Generated Reports" subtitle="Recent report execution history">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-3 py-3 font-semibold">Report Name</th>
                  <th className="px-3 py-3 font-semibold">Generated At</th>
                  <th className="px-3 py-3 font-semibold">Records</th>
                  <th className="px-3 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {reportsRows.map((report) => (
                  <tr key={report.id} className="border-b border-slate-100 text-sm text-slate-700">
                    <td className="px-3 py-3 font-medium text-slate-900">{report.reportName}</td>
                    <td className="px-3 py-3">{report.generatedAt}</td>
                    <td className="px-3 py-3">{formatters.number(report.records)}</td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartPanel>
      </section>
    </div>
  );
}

export default ReportsPage;
