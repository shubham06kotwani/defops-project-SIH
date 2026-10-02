exports.calculatePredictiveDemand = async (indents, containers, sector, daysAhead) => {
  const categories = ['AMMUNITION', 'RATIONS', 'FOL', 'MEDICAL'];
  const forecastResults = [];

  for (const category of categories) {
    const avgDailyConsumption = Math.floor(Math.random() * 50) + 20;
    const predictedRequirement = avgDailyConsumption * daysAhead;

    const totalStockAvailable = containers.reduce((acc, curr) => {
      return acc + (curr.sensors?.battery ? 100 : 50);
    }, 500);

    const daysOfSustainability = Math.floor(totalStockAvailable / avgDailyConsumption);
    const reorderRequired = daysOfSustainability < 15;

    forecastResults.push({
      category,
      avgDailyConsumption,
      predictedRequirement,
      currentStockAvailable: totalStockAvailable,
      daysOfSustainability,
      reorderRequired,
      riskLevel: reorderRequired ? 'HIGH' : 'LOW'
    });
  }

  return forecastResults;
};