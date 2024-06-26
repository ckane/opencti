import React from 'react';
import DeleteOperationsLines, { deleteOperationsLinesQuery } from '@components/trash/all/DeleteOperationsLines';
import { DeleteOperationLineDummy } from '@components/trash/all/DeleteOperationLine';
import ListLines from '../../../components/list_lines/ListLines';
import ExportContextProvider from '../../../utils/ExportContextProvider';
import { usePaginationLocalStorage } from '../../../utils/hooks/useLocalStorage';
import useQueryLoading from '../../../utils/hooks/useQueryLoading';
import { emptyFilterGroup } from '../../../utils/filters/filtersUtils';
import { useFormatter } from '../../../components/i18n';
import Breadcrumbs from '../../../components/Breadcrumbs';
import type { DeleteOperationsLinesPaginationQuery, DeleteOperationsLinesPaginationQuery$variables } from './all/__generated__/DeleteOperationsLinesPaginationQuery.graphql';
import { DataColumns } from '../../../components/list_lines';
import useAuth from '../../../utils/hooks/useAuth';

const LOCAL_STORAGE_KEY = 'trash';

const Trash: React.FC = () => {
  const { t_i18n } = useFormatter();
  const {
    viewStorage,
    paginationOptions,
    helpers: storageHelpers,
  } = usePaginationLocalStorage<DeleteOperationsLinesPaginationQuery$variables>(
    LOCAL_STORAGE_KEY,
    {
      searchTerm: '',
      sortBy: 'timestamp',
      orderAsc: false,
      openExports: false,
      filters: emptyFilterGroup,
    },
  );
  const {
    numberOfElements,
    filters,
    searchTerm,
    sortBy,
    orderAsc,
  } = viewStorage;

  const {
    platformModuleHelpers: { isRuntimeFieldEnable },
  } = useAuth();

  const queryRef = useQueryLoading<DeleteOperationsLinesPaginationQuery>(
    deleteOperationsLinesQuery,
    paginationOptions,
  );

  const renderLines = () => {
    const isRuntimeSort = isRuntimeFieldEnable() ?? false;
    const dataColumns: DataColumns = {
      main_entity_type: {
        label: 'Type',
        width: '12.5%',
        isSortable: false,
      },
      main_entity_name: {
        label: 'Representation',
        width: '37.5%',
        isSortable: true,
      },
      deletedBy: {
        label: 'Deleted by',
        width: '25%',
        isSortable: isRuntimeSort,
      },
      timestamp: {
        label: 'Deletion date',
        width: '25%',
        isSortable: true,
      },
    };
    return (
      <div data-testid="trash-page">
        <ListLines
          helpers={storageHelpers}
          sortBy={sortBy}
          orderAsc={orderAsc}
          dataColumns={dataColumns}
          handleSort={storageHelpers.handleSort}
          handleSearch={storageHelpers.handleSearch}
          handleAddFilter={storageHelpers.handleAddFilter}
          handleRemoveFilter={storageHelpers.handleRemoveFilter}
          handleSwitchGlobalMode={storageHelpers.handleSwitchGlobalMode}
          handleSwitchLocalMode={storageHelpers.handleSwitchLocalMode}
          keyword={searchTerm}
          filters={filters}
          noPadding={true}
          paginationOptions={paginationOptions}
          numberOfElements={numberOfElements}
          secondaryAction={true}
          entityTypes={['DeleteOperation']}
        >
          {queryRef && (
            <React.Suspense
              fallback={
                <>
                  {Array(20)
                    .fill(0)
                    .map((_, idx) => (
                      <DeleteOperationLineDummy
                        key={idx}
                        dataColumns={dataColumns}
                      />
                    ))}
                </>
              }
            >
              <DeleteOperationsLines
                queryRef={queryRef}
                paginationOptions={paginationOptions}
                dataColumns={dataColumns}
                setNumberOfElements={storageHelpers.handleSetNumberOfElements}
              />
            </React.Suspense>
          )}
        </ListLines>
      </div>
    );
  };
  return (
    <ExportContextProvider>
      <Breadcrumbs variant="list" elements={[{ label: t_i18n('Trash'), current: true }]} />
      {renderLines()}
    </ExportContextProvider>
  );
};

export default Trash;
