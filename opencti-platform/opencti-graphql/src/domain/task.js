import { generateInternalId, generateStandardId } from '../schema/identifier';
import { now } from '../utils/format';
import { elIndex, elPaginate } from '../database/elasticSearch';
import { INDEX_INTERNAL_OBJECTS, READ_STIX_INDICES } from '../database/utils';
import { ENTITY_TYPE_TASK } from '../schema/internalObject';
import { deleteElementById, listEntities, loadById, patchAttribute } from '../database/middleware';
import { SYSTEM_USER } from './user';
import { GlobalFilters } from '../utils/filtering';

export const MAX_TASK_ELEMENTS = 500;
export const TASK_TYPE_QUERY = 'QUERY';
export const TASK_TYPE_LIST = 'LIST';

const createDefaultTask = (user, input, taskType, taskExpectedNumber) => {
  const taskId = generateInternalId();
  return {
    id: taskId,
    internal_id: taskId,
    standard_id: generateStandardId(ENTITY_TYPE_TASK, input),
    entity_type: ENTITY_TYPE_TASK,
    initiator_id: user.internal_id,
    created_at: now(),
    completed: false,
    // Task related
    type: taskType,
    last_execution_date: null,
    task_position: null, // To mark the progress.
    task_processed_number: 0, // Initial number of processed element
    task_expected_number: taskExpectedNumber, // Expected number of element processed
    errors: [], // To stock the errors
  };
};

export const findById = async (user, taskId) => {
  return loadById(user, taskId, ENTITY_TYPE_TASK);
};
export const findAll = (user, args) => {
  return listEntities(user, [ENTITY_TYPE_TASK], { ...args, connectionFormat: false });
};

const buildQueryFilters = (rawFilters, taskPosition) => {
  const types = [];
  const queryFilters = [];
  const filters = rawFilters ? JSON.parse(rawFilters) : undefined;
  if (filters) {
    const filterEntries = Object.entries(filters);
    for (let index = 0; index < filterEntries.length; index += 1) {
      const [key, val] = filterEntries[index];
      if (key === 'entity_type') {
        types.push(...val.map((v) => v.id));
      } else {
        queryFilters.push({ key: GlobalFilters[key] || key, values: val.map((v) => v.id) });
      }
    }
  }
  return {
    types,
    first: MAX_TASK_ELEMENTS,
    orderMode: 'asc',
    orderBy: 'internal_id',
    after: taskPosition,
    filters: queryFilters,
  };
};
export const executeTaskQuery = async (user, filters, start = null) => {
  const options = buildQueryFilters(filters, start);
  return elPaginate(user, READ_STIX_INDICES, options);
};

export const createQueryTask = async (user, input) => {
  const { actions, filters } = input;
  const queryData = await executeTaskQuery(user, filters);
  const countExpected = queryData.pageInfo.globalCount;
  const task = createDefaultTask(user, input, TASK_TYPE_QUERY, countExpected);
  const queryTask = { ...task, actions, task_filters: filters };
  await elIndex(INDEX_INTERNAL_OBJECTS, queryTask);
  return queryTask;
};

export const createListTask = async (user, input) => {
  const { actions, ids } = input;
  const task = createDefaultTask(user, input, TASK_TYPE_LIST, ids.length);
  const listTask = { ...task, actions, task_ids: ids };
  await elIndex(INDEX_INTERNAL_OBJECTS, listTask);
  return listTask;
};

export const deleteTask = async (user, taskId) => {
  await deleteElementById(user, taskId, ENTITY_TYPE_TASK);
  return taskId;
};

export const updateTask = async (taskId, patch) => {
  await patchAttribute(SYSTEM_USER, taskId, ENTITY_TYPE_TASK, patch);
};
