function computeStatus(field) {
  if (field.currentStage === 'HARVESTED') {
    return 'Completed';
  }

  const plantingDate = new Date(field.plantingDate);
  const now = new Date();
  const diffDays = Math.floor((now - plantingDate) / (1000 * 60 * 60 * 24));

  // If more than 120 days and not harvested, we'll mark as 'At Risk'
  if (diffDays > 120) {
    return 'At Risk';
  }

  return 'Active';
}

module.exports = { computeStatus };
