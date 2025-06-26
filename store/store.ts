import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Instrument {
  id: string | number;
  no_jft: string | null;
  description: string | null;
  size: string | null;
  serial_number: string | null;
}

type SelectedRow = {
  id: number;
  no_jft: string;
  frequency: string;
  calibration_source: string;
  ref_criteria: string;
  description: string;
};

type SelectionState = {
  selectedRows: SelectedRow[];
  setSelectedRows: (rows: SelectedRow[]) => void;
  clearSelectedRows: () => void;
};

type SelectedItem = {
  usage_no: string | null;
  status: string | null;
};
type InstrumentStore = {
  selectedItem: SelectedItem;
  setSelectedItem: (item: SelectedItem) => void;
  resetSelectedItem: () => void;
};

interface PageState {
  currentPage: string;
  setCurrentPage: (page: string) => void;
}

type CheckboxData = {
  id: string;
  return: boolean;
  good: boolean;
  nc: boolean;
};

type CheckedInstrumentStore = {
  selectedIdCheck: string | null;
  setSelectedIdCheck: (id: string | null) => void;
  checkedInstrumentMap: Record<string, CheckboxData[]>;
  setCheckedInstrumentList: (id: string, data: CheckboxData[]) => void;
  updateCheckedInstrument: (
    id: string,
    index: number,
    field: keyof CheckboxData,
    value: boolean,
  ) => void;
};

interface ScannedStore {
  scannedData: Instrument[];
  addScannedItem: (item: Instrument) => void;
  clearScannedData: () => void;
  removeScannedItemByIndex: (index: number) => void;
}

type StateAccount = {
  checkedAccountRows: Record<number, any>;
  toggleAccountCheck: (id: number, userData: any) => void;
  getCheckedAccounts: () => any[];
  resetCheckedAccounts: () => void;
};

type UserAccount = {
  id: number;
  username: string;
  password: string;
  hak_akses: string;
  user_level: string;
  departemen: string;
  pc_name: string;
  peminjaman: number;
};

type State = {
  checkedRows: { [key: string]: boolean };
  toggleCheck: { (ncr_no?: string | null, forceUncheck?: boolean): void };
};

interface StoreProps {
  control: boolean;
  setControl: () => void;
}

interface PayrollStore {
  openPayroll: boolean;
  setOpenPayroll: (open: boolean) => void;
  fromReturnForm: boolean;
  setFromReturnForm: (fromReturn: boolean) => void;
}

type User = {
  id: number;
  username: string;
  user_level: string;
  hak_akses: string;
};

interface UserState {
  userData: User | null;
  userLevel: string | null;
  userHakAkses: string | null;
  setUserData: (user: User) => void;
  clearUserData: () => void;
}

const useSelectionStore = create<SelectionState>((set) => ({
  selectedRows: [],
  setSelectedRows: (rows) => set({ selectedRows: rows }),
  clearSelectedRows: () => set({ selectedRows: [] }),
}));

const useUserStore = create<UserState>((set) => ({
  userData: null,
  userLevel: null,
  userHakAkses: null,

  setUserData: (user: User) =>
    set({
      userData: user,
      userLevel: user.user_level,
      userHakAkses: user.hak_akses,
    }),

  clearUserData: () =>
    set({
      userData: null,
      userLevel: null,
      userHakAkses: null,
    }),
}));

const usePageStore = create<PageState>((set) => ({
  currentPage: '',
  setCurrentPage: (page) => {
    set({ currentPage: page });
    if (typeof window !== 'undefined') {
      document.cookie = `lastPage=${encodeURIComponent(page)}; path=/`;
    }
  },
}));

const usePayrollStore = create<PayrollStore>()(
  persist(
    (set) => ({
      openPayroll: false,
      setOpenPayroll: (open) => set({ openPayroll: open }),
      fromReturnForm: false,
      setFromReturnForm: (fromReturn) => set({ fromReturnForm: fromReturn }),
    }),
    {
      name: 'payroll-storage',
      partialize: (state) => ({ fromReturnForm: state.fromReturnForm }),
    },
  ),
);

const useWebStore = create<StoreProps>()(
  persist(
    (set) => ({
      control: false,
      setControl: () => {
        set((state) => ({ control: !state.control }));
      },
    }),
    {
      name: 'web-Store',
    },
  ),
);

const useWebStoreInstrument = create<StoreProps>()(
  persist(
    (set) => ({
      control: false,
      setControl: () => {
        set((state) => ({ control: !state.control }));
      },
    }),
    {
      name: 'web-Store',
    },
  ),
);

const useCheckedStore = create<State>((set, get) => ({
  checkedRows: {},

  toggleCheck: (ncr_no?: string | null, forceUncheck?: boolean) => {
    if (forceUncheck) {
      set({ checkedRows: {} });
      return;
    }

    if (!ncr_no) return;

    const currentChecked = get().checkedRows;

    const isAlreadyChecked = !!currentChecked[ncr_no];

    if (isAlreadyChecked) {
      set({ checkedRows: {} });
    } else {
      set({ checkedRows: { [ncr_no]: true } });
    }
  },
}));

const useCheckedAccount = create<StateAccount>((set, get) => ({
  checkedAccountRows: {},

  toggleAccountCheck: (id: number, userData: UserAccount) => {
    set((state) => {
      const isChecked = state.checkedAccountRows[id] !== undefined;

      return {
        checkedAccountRows: isChecked ? {} : { [id]: userData },
      };
    });
  },

  getCheckedAccounts: () => Object.values(get().checkedAccountRows),

  resetCheckedAccounts: () => {
    set({ checkedAccountRows: {} });
  },
}));

const useScannedStore = create<ScannedStore>((set) => ({
  scannedData: [],
  addScannedItem: (item) => set((state) => ({ scannedData: [...state.scannedData, item] })),
  clearScannedData: () => set({ scannedData: [] }),
  removeScannedItemByIndex: (index: number) =>
    set((state) => ({
      scannedData: state.scannedData.filter((_, i) => i !== index),
    })),
}));

const useInstrumentStore = create<InstrumentStore>((set) => ({
  selectedItem: { usage_no: null, status: null },
  setSelectedItem: (item) => set({ selectedItem: item }),
  resetSelectedItem: () => set({ selectedItem: { usage_no: null, status: null } }),
}));

const useCheckedInstrumentStore = create<CheckedInstrumentStore>((set) => ({
  selectedIdCheck: null,
  setSelectedIdCheck: (id) => set({ selectedIdCheck: id }),
  checkedInstrumentMap: {},
  setCheckedInstrumentList: (id, data) =>
    set((state) => ({
      checkedInstrumentMap: { ...state.checkedInstrumentMap, [id]: data },
    })),
  updateCheckedInstrument: (id, index, field, value) =>
    set((state) => {
      const data = state.checkedInstrumentMap[id] || [];
      const updated = [...data];
      if (updated[index]) {
        updated[index] = { ...updated[index], [field]: value };
      }
      return {
        checkedInstrumentMap: {
          ...state.checkedInstrumentMap,
          [id]: updated,
        },
      };
    }),
}));

export {
  useWebStore,
  useCheckedStore,
  useCheckedAccount,
  useWebStoreInstrument,
  useScannedStore,
  useInstrumentStore,
  usePayrollStore,
  useCheckedInstrumentStore,
  useUserStore,
  usePageStore,
  useSelectionStore,
};
