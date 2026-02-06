import { ConnectorConfig, DataConnect, OperationOptions, ExecuteOperationResponse } from 'firebase-admin/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;


export interface CreateNewUserData {
  user_insert: User_Key;
}

export interface CreateNewUserVariables {
  username: string;
  email: string;
}

export interface DeleteTestItemData {
  testItem_delete?: TestItem_Key | null;
}

export interface DeleteTestItemVariables {
  id: UUIDString;
}

export interface GetCurrentUserTestItemsData {
  testItems: ({
    id: UUIDString;
    name: string;
    description?: string | null;
    isCompleted: boolean;
    createdAt: TimestampString;
    updatedAt?: TimestampString | null;
  } & TestItem_Key)[];
}

export interface TestItem_Key {
  id: UUIDString;
  __typename?: 'TestItem_Key';
}

export interface UpdateTestItemData {
  testItem_update?: TestItem_Key | null;
}

export interface UpdateTestItemVariables {
  id: UUIDString;
  name?: string | null;
  description?: string | null;
  isCompleted?: boolean | null;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

/** Generated Node Admin SDK operation action function for the 'CreateNewUser' Mutation. Allow users to execute without passing in DataConnect. */
export function createNewUser(dc: DataConnect, vars: CreateNewUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewUserData>>;
/** Generated Node Admin SDK operation action function for the 'CreateNewUser' Mutation. Allow users to pass in custom DataConnect instances. */
export function createNewUser(vars: CreateNewUserVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<CreateNewUserData>>;

/** Generated Node Admin SDK operation action function for the 'GetCurrentUserTestItems' Query. Allow users to execute without passing in DataConnect. */
export function getCurrentUserTestItems(dc: DataConnect, options?: OperationOptions): Promise<ExecuteOperationResponse<GetCurrentUserTestItemsData>>;
/** Generated Node Admin SDK operation action function for the 'GetCurrentUserTestItems' Query. Allow users to pass in custom DataConnect instances. */
export function getCurrentUserTestItems(options?: OperationOptions): Promise<ExecuteOperationResponse<GetCurrentUserTestItemsData>>;

/** Generated Node Admin SDK operation action function for the 'UpdateTestItem' Mutation. Allow users to execute without passing in DataConnect. */
export function updateTestItem(dc: DataConnect, vars: UpdateTestItemVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateTestItemData>>;
/** Generated Node Admin SDK operation action function for the 'UpdateTestItem' Mutation. Allow users to pass in custom DataConnect instances. */
export function updateTestItem(vars: UpdateTestItemVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<UpdateTestItemData>>;

/** Generated Node Admin SDK operation action function for the 'DeleteTestItem' Mutation. Allow users to execute without passing in DataConnect. */
export function deleteTestItem(dc: DataConnect, vars: DeleteTestItemVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteTestItemData>>;
/** Generated Node Admin SDK operation action function for the 'DeleteTestItem' Mutation. Allow users to pass in custom DataConnect instances. */
export function deleteTestItem(vars: DeleteTestItemVariables, options?: OperationOptions): Promise<ExecuteOperationResponse<DeleteTestItemData>>;

