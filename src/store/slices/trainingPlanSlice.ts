import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface TrainingPlan {
  id: string;
  name: string;
  description: string;
  image: string;
  courseIds: string[];
  createdAt: string;
}

interface TrainingPlanState {
  trainingPlans: TrainingPlan[];
  loading: boolean;
  error: string | null;
}

const initialState: TrainingPlanState = {
  trainingPlans: [],
  loading: false,
  error: null,
};

const trainingPlanSlice = createSlice({
  name: 'trainingPlans',
  initialState,
  reducers: {
    fetchTrainingPlansRequest: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchTrainingPlansSuccess: (state, action: PayloadAction<TrainingPlan[]>) => {
      state.trainingPlans = action.payload;
      state.loading = false;
    },
    fetchTrainingPlansFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    createTrainingPlanRequest: (state, _action: PayloadAction<Omit<TrainingPlan, 'id' | 'createdAt'>>) => {
      state.loading = true;
    },
    createTrainingPlanSuccess: (state, action: PayloadAction<TrainingPlan>) => {
      const exists = state.trainingPlans.some(tp => tp.id === action.payload.id);
      if (!exists) {
        state.trainingPlans.unshift(action.payload);
      }
      state.loading = false;
    },
    updateTrainingPlanRequest: (state, _action: PayloadAction<Partial<TrainingPlan> & { id: string }>) => {
      state.loading = true;
    },
    updateTrainingPlanSuccess: (state, action: PayloadAction<TrainingPlan>) => {
      const index = state.trainingPlans.findIndex(tp => tp.id === action.payload.id);
      if (index !== -1) {
        state.trainingPlans[index] = action.payload;
      }
      state.loading = false;
    },
    deleteTrainingPlanRequest: (state, _action: PayloadAction<string>) => {
      state.loading = true;
    },
    deleteTrainingPlanSuccess: (state, action: PayloadAction<string>) => {
      state.trainingPlans = state.trainingPlans.filter(tp => tp.id !== action.payload);
      state.loading = false;
    },
    clearTrainingPlanError: (state) => {
      state.error = null;
    },
  },
});

export const {
  fetchTrainingPlansRequest,
  fetchTrainingPlansSuccess,
  fetchTrainingPlansFailure,
  createTrainingPlanRequest,
  createTrainingPlanSuccess,
  updateTrainingPlanRequest,
  updateTrainingPlanSuccess,
  deleteTrainingPlanRequest,
  deleteTrainingPlanSuccess,
  clearTrainingPlanError,
} = trainingPlanSlice.actions;

export default trainingPlanSlice.reducer;
