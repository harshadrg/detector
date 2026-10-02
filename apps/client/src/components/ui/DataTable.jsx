import { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { 
  ModuleRegistry, 
  ClientSideRowModelModule, 
  ValidationModule,
  themeQuartz 
} from 'ag-grid-community';

// Register standard AG Grid modules for client-side rendering
ModuleRegistry.registerModules([ClientSideRowModelModule, ValidationModule]);

const detectorTheme = themeQuartz.withParams({
  accentColor: '#5b5a8b',
  backgroundColor: '#ffffff',
  borderColor: '#b3b0bc33',
  headerBackgroundColor: '#f6f2fa',
  headerTextColor: '#5f5e68',
  headerFontSize: 11,
  headerFontWeight: 600,
  fontSize: 12,
  fontFamily: 'Inter, sans-serif',
  rowHoverColor: '#f6f2fa66',
});

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
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={baseDefaultColDef}
        onGridReady={onGridReady}
        theme={detectorTheme}
        {...props}
      />
    </div>
  );
}
