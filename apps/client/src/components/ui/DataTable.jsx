import { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, ClientSideRowModelModule, ValidationModule } from 'ag-grid-community';

// Register standard AG Grid modules for client-side rendering
ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule]);

export function DataTable({ 
  rowData, 
  columnDefs, 
  onGridReady,
  defaultColDef = {},
  className = '',
  height = '400px',
  ...props
}) {
  const baseDefaultColDef = useMemo(() => ({
    sortable: true,
    filter: true,
    resizable: true,
    flex: 1,
    minWidth: 100,
    ...defaultColDef
  }), [defaultColDef]);

  return (
    <div className={`w-full bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 overflow-hidden ${className}`} style={{ height }}>
      {/* 
        Uses modern AG Grid JS-based theme quartz.
        Styles align closely with enterprise material/tailwind defaults. 
      */}
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={baseDefaultColDef}
        onGridReady={onGridReady}
        theme="ag-theme-quartz"
        {...props}
      />
    </div>
  );
}
