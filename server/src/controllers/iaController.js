import axios from 'axios';

export const analyzeAnimalData = async (req, res) => {
  try {
    const { animalId, symptoms, vitals } = req.body;

    if (!animalId || !symptoms) {
      return res.status(400).json({ error: 'Animal ID and symptoms are required' });
    }

    // Simulate AI analysis (can be replaced with actual Google GenAI call)
    const analysis = {
      animalId,
      symptoms,
      vitals: vitals || {},
      prediction: 'Monitor animal closely for the next 24-48 hours',
      recommendation: 'Schedule a veterinary consultation if symptoms persist',
      severity: 'low',
      analyzedAt: new Date()
    };

    res.status(200).json({ analysis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAIDiagnosis = async (req, res) => {
  try {
    const { imageUrl, description } = req.body;

    if (!imageUrl && !description) {
      return res.status(400).json({ error: 'Image URL or description is required' });
    }

    // Simulate AI diagnosis
    const diagnosis = {
      id: Date.now().toString(),
      imageUrl: imageUrl || null,
      description: description || '',
      diagnosis: 'Possible infection detected. Recommend veterinary consultation.',
      confidence: 0.85,
      suggestedActions: [
        'Schedule veterinary consultation',
        'Monitor temperature',
        'Provide supportive care'
      ],
      diagnosedAt: new Date()
    };

    res.status(200).json({ diagnosis });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHealthReport = (req, res) => {
  try {
    const { animalId, startDate, endDate } = req.query;

    if (!animalId) {
      return res.status(400).json({ error: 'Animal ID is required' });
    }

    // Simulate health report
    const report = {
      animalId,
      period: {
        start: startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: endDate || new Date()
      },
      healthScore: 85,
      alerts: ['Weight loss', 'Irregular heartbeat'],
      recommendations: [
        'Schedule veterinary checkup',
        'Improve diet',
        'Increase monitoring frequency'
      ],
      generatedAt: new Date()
    };

    res.status(200).json(report);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
