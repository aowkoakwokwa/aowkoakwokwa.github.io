function extractMonthYear(dateString) {
  if (!dateString || dateString === '-')
    return { no_bulan: null, periode_bulan: null, periode_tahun: null };

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return { no_bulan: null, periode_bulan: null, periode_tahun: null };

  const monthNames = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  return {
    no_bulan: date.getMonth() + 1, // Karena bulan di JS mulai dari 0
    periode_bulan: monthNames[date.getMonth()],
    periode_tahun: date.getFullYear().toString(),
  };
}

export { extractMonthYear };
