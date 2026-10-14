// este archivo contiene las funciones que se ejecutan cuando se llama a las rutas de goals

const asyncHandler = require('express-async-handler')

const Goal = require('../models/goalModel')
const User = require('../models/userModel')

// @desc    Get all goals
// @route   GET /api/goals
// @access  Private
const getGoals = asyncHandler(async (req, res) => {
    const goals = await Goal.find({user: req.user.id})

    res.status(200).json({goals})
})



// @desc    Set a goals
// @route   POST /api/goals
// @access  Private
const setGoal = asyncHandler(async (req, res) => {
    // Si no hay texto, mostramos un error
    if(!req.body.text){
        res.status(400)

        throw new Error('Por favor añade un texto')
    }

    // Si hay texto creamos un nuevo goal
    const goal = await Goal.create({
        text: req.body.text,
        user: req.user.id,
    })

    res.status(200).json({goal})
})



// @desc    Update all goals
// @route   Put /api/goals/:id
// @access  Private
const updateGoal = asyncHandler(async (req, res) => {
    const goal = await Goal.findById(req.params.id)

    if(!goal){
        res.status(400)
        throw new Error('Goal no encontrado')
    }

    const user = await User.findById(req.user.id)

    //Check for user
    if(!user){
        res.status(401)
        throw new Error('Usuario no encontrado')
    }

    if(goal.user.toString() !== user.id){
        res.status(401)
        throw new Error('Usuario no autorizado')
    }

    const updatedGoal = await Goal.findByIdAndUpdate(req.params.id, req.body, {new:true})

    res.status(200).json(updatedGoal)
})



// @desc    Get all goals
// @route   GET /api/goals
// @access  Private
const deleteGoal = asyncHandler(async (req, res) => {
    const goal = await Goal.findById(req.params.id)

    if(!goal){
        res.status(400)
        throw new Error('Goal no encontrado')
    }

    const user = await User.findById(req.user.id)

    //Check for user
    if(!user){
        res.status(401)
        throw new Error('Usuario no encontrado')
    }

    if(goal.user.toString() !== user.id){
        res.status(401)
        throw new Error('Usuario no autorizado')
    }
    
    // await goal.remove() el método remove ya no funciona, se debe usar deleteOne
    await Goal.deleteOne({_id: req.params.id})

    res.status(200).json({id: req.params.id})
})



module.exports = { 
    getGoals, 
    setGoal, 
    updateGoal, 
    deleteGoal
}
