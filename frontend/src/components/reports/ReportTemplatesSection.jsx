import { memo } from "react";
import ReportTemplateCard from "./ReportTemplateCard";

function ReportTemplatesSection({ templates }) {
  return (
    <section>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <span className="material-symbols-outlined text-primary">
            auto_awesome
          </span>
          Quick Templates
        </h3>
        <a href="#" className="text-sm font-semibold text-primary hover:underline">
          View all templates
        </a>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {templates.map((template) => (
          <ReportTemplateCard key={template.title} template={template} />
        ))}
      </div>
    </section>
  );
}

export default memo(ReportTemplatesSection);
