import { useMemo, useRef, useState } from "react";
import ChartPanel from "../components/common/ChartPanel";
import { useAnalytics } from "../context/AnalyticsContext";
import { REQUIRED_DATASET_FIELDS, REQUIRED_WORKBOOK_SHEETS } from "../data/dashboardData";

function DatasetUploadPage() {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [datasetStatus, setDatasetStatus] = useState(null);
  const [isSwitchingDatasetId, setIsSwitchingDatasetId] = useState("");
  const [isRemovingDatasetId, setIsRemovingDatasetId] = useState("");

  const {
    datasetMeta,
    datasets,
    activeDatasetId,
    previewRows,
    validationMessages,
    isImportingDataset,
    importDataset,
    clearDataset,
    switchDataset,
    removeDataset,
  } = useAnalytics();

  const previewColumns = useMemo(
    () => Object.keys(previewRows[0] || REQUIRED_DATASET_FIELDS.reduce((acc, field) => ({ ...acc, [field]: "" }), {})),
    [previewRows]
  );

  const handleFileImport = async (file) => {
    if (!file) {
      return;
    }

    const result = await importDataset(file);

    if (result.success) {
      setUploadStatus({
        tone: "success",
        message: `Dataset imported successfully with ${result.count} records across workbook sheets.`,
      });
      return;
    }

    setUploadStatus({
      tone: "error",
      message: result.issues[0] || "Dataset import failed. Please check your file.",
    });
  };

  const onDrop = async (event) => {
    event.preventDefault();
    setIsDragging(false);

    const [file] = event.dataTransfer.files || [];
    await handleFileImport(file);
  };

  const onInputChange = async (event) => {
    const [file] = event.target.files || [];
    await handleFileImport(file);
    event.target.value = "";
  };

  const handleSwitchDataset = async (datasetId) => {
    setDatasetStatus(null);
    setIsSwitchingDatasetId(datasetId);
    const success = await switchDataset(datasetId);
    setIsSwitchingDatasetId("");

    setDatasetStatus({
      tone: success ? "success" : "error",
      message: success ? "Active dataset switched." : "Unable to switch dataset.",
    });
  };

  const handleRemoveDataset = async (datasetId) => {
    setDatasetStatus(null);
    setIsRemovingDatasetId(datasetId);
    const success = await removeDataset(datasetId);
    setIsRemovingDatasetId("");

    setDatasetStatus({
      tone: success ? "success" : "error",
      message: success ? "Dataset removed." : "Unable to remove dataset.",
    });
  };

  return (
    <div className="mx-auto max-w-[1700px] space-y-6 p-4 sm:p-6 lg:p-8">
      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
        <ChartPanel
          title="Upload Enterprise Workbook"
          subtitle="Upload the multi-sheet workbook for HR, Sales, Marketing, Finance, and Operations analytics"
        >
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={onDrop}
            className={`rounded-2xl border-2 border-dashed p-8 text-center transition ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/40"
            }`}
          >
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-700">
              <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
            </div>
            <p className="text-base font-semibold text-slate-900">Drop your dataset file here</p>
            <p className="mt-1 text-sm text-slate-500">Supports legacy HR `.csv` uploads and enterprise `.xlsx` workbooks</p>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx"
              className="hidden"
              onChange={onInputChange}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              disabled={isImportingDataset}
            >
              {isImportingDataset ? "Processing..." : "Browse Files"}
            </button>
          </div>

          {uploadStatus ? (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                uploadStatus.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {uploadStatus.message}
            </div>
          ) : null}

          {validationMessages.length > 0 && (
            <div className="mt-4 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">Validation Messages</p>
              <ul className="space-y-1 text-sm text-amber-700">
                {validationMessages.map((message) => (
                  <li key={message}>- {message}</li>
                ))}
              </ul>
            </div>
          )}
        </ChartPanel>

         <ChartPanel title="Workbook Requirements" subtitle="Required sheets and core HR fields before processing">
          <div className="flex flex-wrap gap-2">
            {REQUIRED_WORKBOOK_SHEETS.map((sheetName) => (
              <span
                key={sheetName}
                className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
              >
                {sheetName}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {REQUIRED_DATASET_FIELDS.map((field) => (
              <span
                key={field}
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
              >
                {field}
              </span>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-600">
            <div className="space-y-1.5">
              <p>
                <span className="font-semibold text-slate-900">Current Source:</span>{" "}
                {datasetMeta.fileName}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Records Loaded:</span>{" "}
                {datasetMeta.recordCount}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Sheet Counts:</span>{" "}
                HR {datasetMeta.sheetCounts?.hrEmployees || 0} | Sales {datasetMeta.sheetCounts?.sales || 0} |
                Marketing {datasetMeta.sheetCounts?.marketing || 0} | Finance {datasetMeta.sheetCounts?.finance || 0} |
                Operations {datasetMeta.sheetCounts?.operations || 0}
              </p>
              <p>
                <span className="font-semibold text-slate-900">Uploaded At:</span>{" "}
                {new Date(datasetMeta.uploadedAt).toLocaleString("en-US")}
              </p>
            </div>
          </div>
          {datasetStatus ? (
            <div
              className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                datasetStatus.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-700"
              }`}
            >
              {datasetStatus.message}
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Uploaded Datasets
            </p>

            {datasets.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                No dataset uploaded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {datasets.map((dataset) => {
                  const isActive = dataset.datasetId === activeDatasetId;
                  const isSwitching = isSwitchingDatasetId === dataset.datasetId;
                  const isRemoving = isRemovingDatasetId === dataset.datasetId;

                  return (
                    <div
                    key={dataset.datasetId}
                    className={`rounded-2xl border px-5 py-4 text-sm transition shadow-sm hover:shadow-md ${
                      isActive
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-900">
                          {dataset.fileName}
                        </p>

                        {isActive && (
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                            Active
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-500">
                        {dataset.recordCount} rows •{" "}
                        {new Date(dataset.uploadedAt).toLocaleString("en-US")}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleSwitchDataset(dataset.datasetId)}
                        disabled={isActive || isSwitching || isRemoving}
                        className={`rounded-lg border border-emerald-300 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50 ${
                          isActive ? "bg-emerald-50 cursor-default" : "bg-white"
                        }`}
                      >
                        {isActive
                          ? "Active"
                          : isSwitching
                          ? "Switching..."
                          : "Set Active"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveDataset(dataset.datasetId)}
                        disabled={isSwitching || isRemoving}
                        className="rounded-lg border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-400 hover:bg-rose-50 disabled:opacity-70"
                      >
                        {isRemoving ? "Removing..." : "Remove"}
                      </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={clearDataset}
            className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400"
          >
            Remove Active Dataset
          </button>
        </ChartPanel>
      </section>

      <section>
        <ChartPanel title="Dataset Preview" subtitle="First rows after validation and normalization">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-[0.12em] text-slate-500">
                  {previewColumns.map((column) => (
                    <th key={column} className="px-3 py-3 font-semibold">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, rowIndex) => (
                  <tr key={`preview-${rowIndex}`} className="border-b border-slate-100 text-sm text-slate-700">
                    {previewColumns.map((column) => (
                      <td key={`${column}-${rowIndex}`} className="px-3 py-3">
                        {row[column]}
                      </td>
                    ))}
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

export default DatasetUploadPage;
