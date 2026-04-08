/**
 * Formats a date value (Date, string, number, or Firebase Timestamp) into a localized string.
 * Supports various input formats commonly found in Firestore.
 */
export const formatDate = (
  dateVal: any,
  locale: string = 'en-IN',
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }
): string => {
  if (!dateVal) return 'N/A';

  try {
    let d: Date;

    // Handle Firebase Timestamp { seconds, nanoseconds }
    if (typeof dateVal === 'object' && dateVal !== null && 'seconds' in dateVal) {
      d = new Date(dateVal.seconds * 1000);
    } 
    // Handle Numeric Timestamps
    else if (typeof dateVal === 'number') {
      // If timestamp is in seconds (10 digits), convert to milliseconds
      d = new Date(dateVal < 10000000000 ? dateVal * 1000 : dateVal);
    } 
    // Handle strings and Date objects
    else {
      d = new Date(dateVal);
    }

    // Check if the resulting date is valid
    if (isNaN(d.getTime())) {
      return 'N/A';
    }

    // Format according to locale and options
    // Map simplified locale strings to BCP 47 tags if needed
    const localeMap: Record<string, string> = {
      'en': 'en-US',
      'de': 'de-DE',
      'fr': 'fr-FR',
      'en-IN': 'en-IN'
    };

    const finalLocale = localeMap[locale] || locale;

    return d.toLocaleDateString(finalLocale, options);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'N/A';
  }
};
