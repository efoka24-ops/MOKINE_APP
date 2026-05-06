import { animals } from '../models/mockData.js';

let animalDatabase = [...animals];

export const getAllAnimals = (req, res) => {
  try {
    const userAnimals = animalDatabase.filter(a => a.ownerId === req.user.id);
    res.status(200).json(userAnimals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAnimalById = (req, res) => {
  try {
    const animal = animalDatabase.find(a => a.id === req.params.id && a.ownerId === req.user.id);
    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }
    res.status(200).json(animal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addAnimal = (req, res) => {
  try {
    const { name, type, breed, birthDate, collarId } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const newAnimal = {
      id: Date.now().toString(),
      ownerId: req.user.id,
      name,
      type,
      breed: breed || '',
      birthDate: birthDate ? new Date(birthDate) : new Date(),
      collarId: collarId || '',
      status: 'healthy',
      createdAt: new Date()
    };

    animalDatabase.push(newAnimal);
    res.status(201).json({ message: 'Animal added', animal: newAnimal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateAnimal = (req, res) => {
  try {
    const animal = animalDatabase.find(a => a.id === req.params.id && a.ownerId === req.user.id);
    if (!animal) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    const { name, breed, status, collarId } = req.body;
    if (name) animal.name = name;
    if (breed) animal.breed = breed;
    if (status) animal.status = status;
    if (collarId) animal.collarId = collarId;
    animal.updatedAt = new Date();

    res.status(200).json({ message: 'Animal updated', animal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAnimal = (req, res) => {
  try {
    const index = animalDatabase.findIndex(a => a.id === req.params.id && a.ownerId === req.user.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Animal not found' });
    }

    const deletedAnimal = animalDatabase.splice(index, 1);
    res.status(200).json({ message: 'Animal deleted', animal: deletedAnimal[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
