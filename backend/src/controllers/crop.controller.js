const prisma = require('../config/db');
const { NotFoundError } = require('../utils/errors');

const getAllCrops = async (req, res, next) => {
  try {
    const crops = await prisma.crop.findMany();
    res.status(200).json({
      success: true,
      data: crops,
    });
  } catch (error) {
    next(error);
  }
};

const getCropById = async (req, res, next) => {
  try {
    const cropId = parseInt(req.params.id);
    const crop = await prisma.crop.findUnique({
      where: { id: cropId },
    });
    if (!crop) {
      throw new NotFoundError('Crop not found');
    }
    res.status(200).json({
      success: true,
      data: crop,
    });
  } catch (error) {
    next(error);
  }
};

const getMarketRates = async (req, res, next) => {
  try {
    const crops = await prisma.crop.findMany({
      include: {
        prices: {
          orderBy: { effectiveDate: 'desc' },
          take: 2,
        },
      },
    });

    const rates = crops.map((crop) => {
      const priceRecords = crop.prices;
      const latestPrice = priceRecords[0];
      const previousPrice = priceRecords[1];

      let msp = latestPrice ? latestPrice.mspPrice : 0;
      let market = latestPrice ? latestPrice.marketPrice : 0;
      let change = 0;
      let trend = 'stable';

      if (latestPrice && previousPrice) {
        change = latestPrice.marketPrice - previousPrice.marketPrice;
        trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';
      }

      return {
        id: crop.id,
        crop: crop.name,
        cropHi: crop.nameHi,
        msp,
        market,
        unit: crop.unit,
        change: change >= 0 ? `+${change}` : `${change}`,
        trend,
        effectiveDate: latestPrice ? latestPrice.effectiveDate.toISOString().split('T')[0] : null,
      };
    });

    res.status(200).json({
      success: true,
      data: rates,
    });
  } catch (error) {
    next(error);
  }
};

const getMarketRatesByCropId = async (req, res, next) => {
  try {
    const cropId = parseInt(req.params.cropId);
    
    const crop = await prisma.crop.findUnique({
      where: { id: cropId },
      include: {
        prices: {
          orderBy: { effectiveDate: 'desc' },
        },
      },
    });

    if (!crop) {
      throw new NotFoundError('Crop not found');
    }

    res.status(200).json({
      success: true,
      data: crop,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCrops,
  getCropById,
  getMarketRates,
  getMarketRatesByCropId,
};
