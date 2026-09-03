const prisma = require('../config/db');
const { NotFoundError } = require('../utils/errors');
const memoryCache = require('../utils/cache');

const getAllCrops = async (req, res, next) => {
  try {
    const cachedCrops = memoryCache.get('all_crops');
    if (cachedCrops) {
      return res.status(200).json({
        success: true,
        data: cachedCrops,
      });
    }

    const crops = await prisma.crop.findMany({
      include: {
        prices: {
          orderBy: { effectiveDate: 'desc' },
          take: 1,
        },
      },
    });

    memoryCache.set('all_crops', crops, 300); // 5 minutes cache
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
    const cachedRates = memoryCache.get('market_rates');
    if (cachedRates) {
      return res.status(200).json({
        success: true,
        data: cachedRates,
      });
    }

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

      if (latestPrice && previousPrice) {
        change = latestPrice.marketPrice - previousPrice.marketPrice;
      } else if (latestPrice) {
        change = latestPrice.marketPrice - latestPrice.mspPrice;
      }

      const trend = change > 0 ? 'up' : change < 0 ? 'down' : 'stable';

      return {
        id: crop.id,
        crop: crop.name,
        cropHi: crop.nameHi,
        msp,
        market,
        unit: crop.unit,
        change: change > 0 ? `+${change}` : `${change}`,
        trend,
        effectiveDate: latestPrice ? latestPrice.effectiveDate.toISOString().split('T')[0] : null,
      };
    });

    memoryCache.set('market_rates', rates, 180); // 3 minutes cache

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

const { CROP_PROCESSING_RATES } = require('../config/procurementRates');

const getProcessingRates = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: CROP_PROCESSING_RATES,
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
  getProcessingRates,
};
