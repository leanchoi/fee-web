export function getAdmissionYear(): number {
  const now = new Date();
  const currentYear = now.getFullYear();
  
  // Cutoff date: January 30 of current year (month is 0-indexed: 0 = January)
  const cutoff = new Date(currentYear, 0, 30);
  
  if (now >= cutoff) {
    return currentYear + 1;
  } else {
    return currentYear;
  }
}
