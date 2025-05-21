const MenuItem = require('../models/MenuItem');

exports.getMenu = async (req, res) => {
  try {
    const menu = await MenuItem.find();
    res.json(menu);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération du menu' });
  }
};

exports.addMenuItem = async (req, res) => {
  try {
    const { name, price, category, description, imageUrl } = req.body;
    const item = new MenuItem({ name, price, category, description, imageUrl });
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de l\'ajout du menu' });
  }
};

exports.updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, category, description, imageUrl } = req.body;

    const updatedItem = await MenuItem.findByIdAndUpdate(id,
      { name, price, category, description, imageUrl },
      { new: true }
    );

    if (!updatedItem) return res.status(404).json({ error: 'Élément non trouvé' });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du menu' });
  }
};

exports.deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MenuItem.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: 'Élément non trouvé' });
    res.json({ message: 'Élément supprimé avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
};
