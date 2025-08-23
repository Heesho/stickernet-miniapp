/**
 * Loading Table Component
 * 
 * Table component with integrated loading states, skeleton rows,
 * and pagination loading support.
 */

"use client";

import React, { memo } from 'react';
import { TableRowSkeleton } from './LoadingSkeleton';
import { EnhancedLoadingSpinner } from './LoadingSpinner.enhanced';

/**
 * Loading table props
 */
export interface LoadingTableProps {
  /** Whether table is loading */
  loading?: boolean;
  /** Error state */
  error?: boolean;
  /** Empty state */
  empty?: boolean;
  /** Number of skeleton rows to show */
  skeletonRows?: number;
  /** Number of columns */
  columns?: number;
  /** Table headers */
  headers?: string[];
  /** Loading message */
  loadingMessage?: string;
  /** Error message */
  errorMessage?: string;
  /** Empty message */
  emptyMessage?: string;
  /** Retry function */
  onRetry?: () => void;
  /** Table content */
  children?: React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show table headers during loading */
  showHeadersWhileLoading?: boolean;
  /** Whether table is loading more data (pagination) */
  loadingMore?: boolean;
  /** Loading more message */
  loadingMoreMessage?: string;
}

/**
 * Table loading state component
 */
const TableLoadingState = memo(function TableLoadingState({
  skeletonRows = 5,
  columns = 3,
  showHeaders = false,
  headers = [],
  message = 'Loading...'
}: {
  skeletonRows: number;
  columns: number;
  showHeaders: boolean;
  headers: string[];
  message: string;
}) {
  return (
    <>
      {/* Headers */}
      {showHeaders && headers.length > 0 && (
        <thead>
          <tr className="border-b border-[var(--app-border)]">
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-4 py-3 text-left text-sm font-medium text-[var(--app-foreground)] uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
      )}
      
      {/* Loading rows */}
      <tbody>
        {Array.from({ length: skeletonRows }, (_, index) => (
          <tr key={index}>
            <td colSpan={Math.max(columns, headers.length)} className="p-0">
              <TableRowSkeleton columns={Math.max(columns, headers.length)} />
            </td>
          </tr>
        ))}
      </tbody>
    </>
  );
});

/**
 * Table error state component
 */
const TableErrorState = memo(function TableErrorState({
  message = 'Failed to load data',
  onRetry,
  columns = 3
}: {
  message: string;
  onRetry?: () => void;
  columns: number;
}) {
  return (
    <tbody>
      <tr>
        <td colSpan={columns} className="px-4 py-12">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-[var(--app-foreground)] font-medium">Error Loading Data</p>
              <p className="text-sm text-[var(--app-foreground-muted)] mt-1">{message}</p>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-4 py-2 text-sm font-medium text-[var(--app-accent)] border border-[var(--app-accent)] rounded-md hover:bg-[var(--app-accent)] hover:text-white transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </td>
      </tr>
    </tbody>
  );
});

/**
 * Table empty state component
 */
const TableEmptyState = memo(function TableEmptyState({
  message = 'No data available',
  columns = 3
}: {
  message: string;
  columns: number;
}) {
  return (
    <tbody>
      <tr>
        <td colSpan={columns} className="px-4 py-12">
          <div className="flex flex-col items-center justify-center space-y-3 text-center">
            <svg className="w-12 h-12 text-[var(--app-foreground-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-[var(--app-foreground-muted)]">{message}</p>
          </div>
        </td>
      </tr>
    </tbody>
  );
});

/**
 * Loading more indicator component
 */
const LoadingMoreIndicator = memo(function LoadingMoreIndicator({
  message = 'Loading more...',
  columns = 3
}: {
  message: string;
  columns: number;
}) {
  return (
    <tr>
      <td colSpan={columns} className="px-4 py-4">
        <div className="flex items-center justify-center space-x-3">
          <EnhancedLoadingSpinner
            variant="dots"
            size="sm"
          />
          <span className="text-sm text-[var(--app-foreground-muted)]">
            {message}
          </span>
        </div>
      </td>
    </tr>
  );
});

/**
 * Main loading table component
 */
export const LoadingTable = memo(function LoadingTable({
  loading = false,
  error = false,
  empty = false,
  skeletonRows = 5,
  columns = 3,
  headers = [],
  loadingMessage = 'Loading...',
  errorMessage = 'Failed to load data',
  emptyMessage = 'No data available',
  onRetry,
  children,
  className = '',
  showHeadersWhileLoading = true,
  loadingMore = false,
  loadingMoreMessage = 'Loading more...'
}: LoadingTableProps) {
  
  // Calculate effective columns
  const effectiveColumns = Math.max(columns, headers.length);

  // Base table classes
  const tableClasses = `
    w-full border-collapse bg-[var(--app-card-bg)] border border-[var(--app-border)] rounded-lg overflow-hidden
    ${className}
  `;

  // Render table content based on state
  const renderTableContent = () => {
    if (loading) {
      return (
        <TableLoadingState
          skeletonRows={skeletonRows}
          columns={effectiveColumns}
          showHeaders={showHeadersWhileLoading}
          headers={headers}
          message={loadingMessage}
        />
      );
    }

    if (error) {
      return (
        <TableErrorState
          message={errorMessage}
          onRetry={onRetry}
          columns={effectiveColumns}
        />
      );
    }

    if (empty) {
      return (
        <TableEmptyState
          message={emptyMessage}
          columns={effectiveColumns}
        />
      );
    }

    // Success state with actual content
    return (
      <>
        {/* Headers */}
        {headers.length > 0 && (
          <thead>
            <tr className="border-b border-[var(--app-border)] bg-[var(--app-gray-light)]">
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-4 py-3 text-left text-sm font-medium text-[var(--app-foreground)] uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
        )}
        
        {/* Content */}
        <tbody>
          {children}
          
          {/* Loading more indicator */}
          {loadingMore && (
            <LoadingMoreIndicator
              message={loadingMoreMessage}
              columns={effectiveColumns}
            />
          )}
        </tbody>
      </>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className={tableClasses}>
        {renderTableContent()}
      </table>
    </div>
  );
});

/**
 * Data table with enhanced loading states
 */
export interface DataTableProps<T = any> extends Omit<LoadingTableProps, 'children'> {
  /** Table data */
  data?: T[];
  /** Row render function */
  renderRow?: (item: T, index: number) => React.ReactNode;
  /** Whether data is being fetched */
  fetching?: boolean;
  /** Whether more data is available */
  hasMore?: boolean;
  /** Load more function */
  onLoadMore?: () => void;
  /** Page size for skeleton rows */
  pageSize?: number;
}

export const DataTable = memo(function DataTable<T = any>({
  data = [],
  renderRow,
  fetching = false,
  hasMore = false,
  onLoadMore,
  pageSize = 10,
  ...props
}: DataTableProps<T>) {
  
  // Determine states
  const loading = props.loading || (fetching && data.length === 0);
  const empty = !loading && !props.error && data.length === 0;
  const loadingMore = fetching && data.length > 0;

  // Auto-trigger load more when scrolling near bottom
  const tableRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    if (!hasMore || loadingMore || !onLoadMore) return;

    const handleScroll = () => {
      const element = tableRef.current;
      if (!element) return;

      const { scrollTop, scrollHeight, clientHeight } = element;
      const nearBottom = scrollTop + clientHeight >= scrollHeight - 100;

      if (nearBottom) {
        onLoadMore();
      }
    };

    const element = tableRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, loadingMore, onLoadMore]);

  return (
    <div ref={tableRef} className="max-h-96 overflow-y-auto">
      <LoadingTable
        {...props}
        loading={loading}
        empty={empty}
        loadingMore={loadingMore}
        skeletonRows={loading ? pageSize : props.skeletonRows}
      >
        {data.map((item, index) => renderRow?.(item, index))}
      </LoadingTable>
    </div>
  );
});

/**
 * Simple table row component
 */
export const TableRow = memo(function TableRow({
  children,
  onClick,
  className = ''
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <tr
      className={`
        border-b border-[var(--app-border)] hover:bg-[var(--app-gray-light)] transition-colors
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      {children}
    </tr>
  );
});

/**
 * Simple table cell component
 */
export const TableCell = memo(function TableCell({
  children,
  className = '',
  header = false
}: {
  children: React.ReactNode;
  className?: string;
  header?: boolean;
}) {
  const Tag = header ? 'th' : 'td';
  
  return (
    <Tag className={`px-4 py-3 text-sm text-[var(--app-foreground)] ${className}`}>
      {children}
    </Tag>
  );
});

