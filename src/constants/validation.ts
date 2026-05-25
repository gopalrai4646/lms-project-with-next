export const VALIDATION_LIMITS = {
  TRAINING_PLAN: {
    NAME_MIN_LENGTH: 3,
    NAME_MAX_LENGTH: 80,
    DESCRIPTION_MIN_LENGTH: 10,
    DESCRIPTION_MAX_LENGTH: 500,
  },
  IMAGE: {
    MAX_SIZE_MB: 2,
    MAX_SIZE_BYTES: 2 * 1024 * 1024,
    ACCEPTED_TYPES: 'image/png,image/jpeg,image/webp',
  },
};
