import db from '../db/index.js';
import { sendFarmInvitationEmail } from '../services/emailService.js';

// GET /api/farms  — fermes du user (propriétaire ou membre)
export const getFarms = async (req, res) => {
  try {
    const owned = await db.farms.filter(f => f.ownerId === req.user.id);
    const memberships = await db.farm_members.filter(m => m.userId === req.user.id && m.status === 'active');
    const memberFarmIds = memberships.map(m => m.farmId);
    const memberFarms = await db.farms.filter(f => memberFarmIds.includes(f.id) && f.ownerId !== req.user.id);
    res.json({ farms: [...owned, ...memberFarms] });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/farms
export const createFarm = async (req, res) => {
  try {
    const { name, location, animalTypes, description } = req.body;
    if (!name) return res.status(400).json({ error: 'name requis' });
    const farm = await db.farms.insert({
      ownerId: req.user.id,
      ownerName: req.user.name,
      name, location: location || {}, animalTypes: animalTypes || [],
      description: description || '',
      createdAt: new Date().toISOString(),
    });
    res.status(201).json({ message: 'Ferme créée', farm });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// GET /api/farms/:id
export const getFarmById = async (req, res) => {
  try {
    const farm = await db.farms.findById(req.params.id);
    if (!farm) return res.status(404).json({ error: 'Ferme introuvable' });
    const members = await db.farm_members.filter(m => m.farmId === req.params.id);
    const isOwner = farm.ownerId === req.user.id;
    const isMember = members.some(m => m.userId === req.user.id && m.status === 'active');
    if (!isOwner && !isMember) return res.status(403).json({ error: 'Accès refusé' });
    res.json({ ...farm, members });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/farms/:id/invite
export const inviteMember = async (req, res) => {
  try {
    const { phone, email, role = 'assistant' } = req.body;
    if (!phone && !email) return res.status(400).json({ error: 'phone ou email requis' });
    const farm = await db.farms.findOne(f => f.id === req.params.id && f.ownerId === req.user.id);
    if (!farm) return res.status(403).json({ error: 'Non autorisé ou ferme introuvable' });
    const invitation = await db.farm_members.insert({
      farmId: req.params.id,
      farmName: farm.name,
      invitedBy: req.user.id,
      invitedByName: req.user.name,
      phone: phone || null,
      email: email || null,
      role,
      status: 'pending',
      token: Math.random().toString(36).substring(2, 12).toUpperCase(),
      userId: null,
      createdAt: new Date().toISOString(),
    });
    const inviteLink = `/farm/join/${invitation.token}`;
    if (email) {
      sendFarmInvitationEmail({
        to: email,
        inviterName: req.user.name,
        farmName: farm.name,
        inviteLink,
      }).catch(() => {});
    }
    res.status(201).json({ message: 'Invitation envoyée', invitation, inviteLink });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// POST /api/farms/join/:token
export const joinFarm = async (req, res) => {
  try {
    const invite = await db.farm_members.findOne(m => m.token === req.params.token && m.status === 'pending');
    if (!invite) return res.status(404).json({ error: 'Invitation invalide ou expirée' });
    const updated = await db.farm_members.update(invite.id, {
      status: 'active', userId: req.user.id, userName: req.user.name, joinedAt: new Date().toISOString(),
    });
    res.json({ message: `Vous avez rejoint la ferme ${invite.farmName}`, role: invite.role });
  } catch (e) { res.status(500).json({ error: e.message }); }
};

// DELETE /api/farms/:id/members/:memberId
export const removeMember = async (req, res) => {
  try {
    const farm = await db.farms.findOne(f => f.id === req.params.id && f.ownerId === req.user.id);
    if (!farm) return res.status(403).json({ error: 'Non autorisé' });
    const member = await db.farm_members.findOne(m => m.id === req.params.memberId && m.farmId === req.params.id);
    if (!member) return res.status(404).json({ error: 'Membre introuvable' });
    await db.farm_members.remove(member.id);
    res.json({ message: 'Membre retiré' });
  } catch (e) { res.status(500).json({ error: e.message }); }
};
