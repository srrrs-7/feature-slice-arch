import { writable } from "svelte/store";
import type { DialogState } from "../types";

const initialState: DialogState = {
  createTask: false,
  editTask: { open: false, taskId: null },
  deleteTask: { open: false, taskId: null },
};

export const dialogs = writable<DialogState>(initialState);

export const dialogActions = {
  openCreate() {
    dialogs.update((state) => ({ ...state, createTask: true }));
  },
  closeCreate() {
    dialogs.update((state) => ({ ...state, createTask: false }));
  },
  openEdit(taskId: string) {
    dialogs.update((state) => ({ ...state, editTask: { open: true, taskId } }));
  },
  closeEdit() {
    dialogs.update((state) => ({
      ...state,
      editTask: { open: false, taskId: null },
    }));
  },
  openDelete(taskId: string) {
    dialogs.update((state) => ({
      ...state,
      deleteTask: { open: true, taskId },
    }));
  },
  closeDelete() {
    dialogs.update((state) => ({
      ...state,
      deleteTask: { open: false, taskId: null },
    }));
  },
};
