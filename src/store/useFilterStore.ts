import { create } from "zustand";

export interface FilterState {
  search: string;
  difficulty: "ALL" | "EASY" | "MEDIUM" | "HARD";
  topic: string;
  status: "ALL" | "SOLVED" | "IN_PROGRESS" | "UNSOLVED";
  bookmarkedOnly: boolean;
  sortBy: "order" | "title" | "difficulty" | "revisionCount";
  sortOrder: "asc" | "desc";
  page: number;
  limit: number;

  setSearch: (search: string) => void;
  setDifficulty: (difficulty: "ALL" | "EASY" | "MEDIUM" | "HARD") => void;
  setTopic: (topic: string) => void;
  setStatus: (status: "ALL" | "SOLVED" | "IN_PROGRESS" | "UNSOLVED") => void;
  setBookmarkedOnly: (bookmarkedOnly: boolean) => void;
  setSort: (sortBy: "order" | "title" | "difficulty" | "revisionCount", sortOrder?: "asc" | "desc") => void;
  setPage: (page: number) => void;
  resetFilters: () => void;
}

const initialState = {
  search: "",
  difficulty: "ALL" as const,
  topic: "ALL",
  status: "ALL" as const,
  bookmarkedOnly: false,
  sortBy: "order" as const,
  sortOrder: "asc" as const,
  page: 1,
  limit: 10,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...initialState,

  setSearch: (search) => set({ search, page: 1 }),
  setDifficulty: (difficulty) => set({ difficulty, page: 1 }),
  setTopic: (topic) => set({ topic, page: 1 }),
  setStatus: (status) => set({ status, page: 1 }),
  setBookmarkedOnly: (bookmarkedOnly) => set({ bookmarkedOnly, page: 1 }),
  setSort: (sortBy, sortOrder) =>
    set((state) => ({
      sortBy,
      sortOrder:
        sortOrder ?? (state.sortBy === sortBy && state.sortOrder === "asc" ? "desc" : "asc"),
      page: 1,
    })),
  setPage: (page) => set({ page }),
  resetFilters: () => set(initialState),
}));
