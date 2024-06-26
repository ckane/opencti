import React, { FunctionComponent, useEffect } from 'react';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import { Link, Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import Search from '@components/Search';
import SearchIndexedFiles from '@components/search/SearchIndexedFiles';
import EEChip from '@components/common/entreprise_edition/EEChip';
import { graphql, PreloadedQuery, usePreloadedQuery, useQueryLoader } from 'react-relay';
import Badge from '@mui/material/Badge';
import ExportContextProvider from '../../utils/ExportContextProvider';
import { useFormatter } from '../../components/i18n';
import { decodeSearchKeyword } from '../../utils/SearchUtils';
import useAuth from '../../utils/hooks/useAuth';
import { SearchRootFilesCountQuery } from './__generated__/SearchRootFilesCountQuery.graphql';
import Breadcrumbs from '../../components/Breadcrumbs';

const searchRootFilesCountQuery = graphql`
  query SearchRootFilesCountQuery($search: String) {
    indexedFilesCount(search: $search)
  }
`;

interface SearchRootComponentProps {
  filesCount?: number;
}

const SearchRootComponent: FunctionComponent<SearchRootComponentProps> = ({ filesCount = 0 }) => {
  const { t_i18n } = useFormatter();
  const { keyword } = useParams() as { keyword: string };
  const location = useLocation();
  let searchType = 'knowledge';
  if (location.pathname.includes('/files')) {
    searchType = 'files';
  }
  return (
    <ExportContextProvider>
      <Breadcrumbs variant="standard" elements={[{ label: t_i18n('Search') }, { label: t_i18n('Advanced search'), current: true }]} />
      <Box
        sx={{
          borderBottom: 1,
          borderColor: 'divider',
          marginBottom: 4,
        }}
      >
        <Tabs value={searchType}>
          <Tab
            component={Link}
            to={`/dashboard/search/knowledge/${keyword ?? ''}`}
            value='knowledge'
            label={t_i18n('Knowledge search')}
          />
          <Tab
            component={Link}
            to={`/dashboard/search/files/${keyword ?? ''}`}
            value='files'
            label={<>
              <Badge badgeContent={filesCount} color="primary">
                <div style={{ padding: '0px 12px', display: 'flex' }}>{t_i18n('Files search')}<EEChip /></div>
              </Badge>
            </>
              }
          />
        </Tabs>
      </Box>
      <Routes>
        <Route
          path="/knowledge"
          element={
            <Search />
          }
        />
        <Route
          path="/knowledge/:keyword"
          element={
            <Search />
          }
        />
        <Route
          path="/files"
          element={
            <SearchIndexedFiles />
          }
        />
        <Route
          path="/files/:keyword"
          element={
            <SearchIndexedFiles />
          }
        />
        <Route path="/" element={
          <Navigate to="/dashboard/search/knowledge" />
        }
        />
      </Routes>
    </ExportContextProvider>
  );
};

interface SearchRootComponentWithQueryProps {
  queryRef: PreloadedQuery<SearchRootFilesCountQuery>;
}

const SearchRootComponentWithQuery: FunctionComponent<SearchRootComponentWithQueryProps> = ({ queryRef }) => {
  const { indexedFilesCount } = usePreloadedQuery<SearchRootFilesCountQuery>(searchRootFilesCountQuery, queryRef);
  const filesCount = indexedFilesCount ?? 0;
  return (
    <SearchRootComponent filesCount={filesCount} />
  );
};

const SearchRoot = () => {
  const {
    platformModuleHelpers: { isFileIndexManagerEnable },
  } = useAuth();
  const fileSearchEnabled = isFileIndexManagerEnable();
  const { keyword } = useParams() as { keyword: string };
  const searchTerm = decodeSearchKeyword(keyword);

  const [queryRef, loadQuery] = useQueryLoader<SearchRootFilesCountQuery>(searchRootFilesCountQuery);
  const queryArgs = {
    search: searchTerm,
  };
  useEffect(() => {
    if (fileSearchEnabled && searchTerm) {
      loadQuery(queryArgs, { fetchPolicy: 'store-and-network' });
    }
  }, []);

  if (queryRef) {
    return (<SearchRootComponentWithQuery queryRef={queryRef} />);
  }
  return (<SearchRootComponent />);
};

export default SearchRoot;
