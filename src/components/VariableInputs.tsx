"use client";

interface VariableInputsProps {
  variables: string[];
  values: Record<string, string>;
  onChange: (varName: string, value: string) => void;
}

export default function VariableInputs({
  variables,
  values,
  onChange,
}: VariableInputsProps) {
  if (variables.length === 0) return null;

  return (
    <div className="border-t border-gray-200 pt-3 mt-3">
      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">
        Variables ({variables.length})
      </p>
      <div className="space-y-2">
        {variables.map((varName) => (
          <div key={varName} className="flex items-center gap-2">
            <label className="text-xs font-mono text-mmp-accent min-w-[120px]">
              {`{{${varName}}}`}
            </label>
            <input
              type="text"
              value={values[varName] || ""}
              onChange={(e) => onChange(varName, e.target.value)}
              placeholder={`Enter ${varName}...`}
              className="flex-1 px-2 py-1.5 text-sm border border-gray-200 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-mmp-accent focus:border-mmp-accent"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
