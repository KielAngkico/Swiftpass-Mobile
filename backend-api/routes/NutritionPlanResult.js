
const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/nutrition-plan-result/:rfid_tag", async (req, res) => {
  const { rfid_tag } = req.params;
  
  console.log("🔹 Incoming request for RFID:", rfid_tag);
  
  try {
    const result = await db.query(
      `SELECT id, member_id, calories_target, protein_grams, carbs_grams, fats_grams 
       FROM NutritionAssessment 
       WHERE rfid_tag = ? 
       ORDER BY id DESC 
       LIMIT 1`,
      [rfid_tag]
    );
    
    console.log("🔹 Full query result:", result);

    if (result && result.id) {

      const response = {
        id: result.id,
        member_id: result.member_id,
        calories_target: result.calories_target || 0,
        protein_grams: result.protein_grams || 0,
        carbs_grams: result.carbs_grams || 0,
        fats_grams: result.fats_grams || 0
      };
      
      console.log("✅ Sending response:", response);
      return res.status(200).json(response);
    }
    

    let data = null;
    if (Array.isArray(result) && result.length > 0) {
      data = result[0];
    } else if (result && result[0] && Array.isArray(result[0]) && result[0].length > 0) {
      data = result[0][0];
    } else if (result && result.rows && result.rows.length > 0) {
      data = result.rows[0];
    }
    
    if (data && data.id) {
      const response = {
        id: data.id,
        member_id: data.member_id,
        calories_target: data.calories_target || 0,
        protein_grams: data.protein_grams || 0,
        carbs_grams: data.carbs_grams || 0,
        fats_grams: data.fats_grams || 0
      };
      
      console.log("✅ Sending response:", response);
      return res.status(200).json(response);
    }
    
    console.log("⚠️ No nutrition plan found for RFID:", rfid_tag);
    return res.status(404).json({ 
      error: "No nutrition plan found",
      rfid_tag: rfid_tag
    });
    
  } catch (error) {
    console.error("❌ Error fetching nutrition plan:", error);
    return res.status(500).json({ 
      error: "Server error",
      message: error.message 
    });
  }
});


router.get("/specific-foods/:rfid_tag", async (req, res) => {
  const { rfid_tag } = req.params;
  console.log("🍽️ Fetching specific foods for RFID:", rfid_tag);

  try {

    const assessmentResult = await db.query(
      `SELECT id FROM NutritionAssessment 
       WHERE rfid_tag = ? 
       ORDER BY id DESC 
       LIMIT 1`,
      [rfid_tag]
    );

    let assessmentData = null;
    if (Array.isArray(assessmentResult) && assessmentResult.length > 0) {
      if (Array.isArray(assessmentResult[0]) && assessmentResult[0].length > 0) {
        assessmentData = assessmentResult[0][0];
      } else {
        assessmentData = assessmentResult[0];
      }
    } else if (assessmentResult && assessmentResult.id) {
      assessmentData = assessmentResult;
    }

    if (!assessmentData || !assessmentData.id) {
      console.log("⚠️ No nutrition assessment found for RFID:", rfid_tag);
      return res.status(200).json([]);
    }

    const foodsResult = await db.query(
      `SELECT 
         food_id,
         food_name,
         macro_type,
         portion_grams,
         calories,
         protein,
         carbs,
         fats
       FROM MemberNutritionResult 
       WHERE assessment_id = ?
       ORDER BY macro_type, food_name`,
      [assessmentData.id]
    );

    let foods = [];
    if (Array.isArray(foodsResult) && foodsResult.length > 0) {
      foods = Array.isArray(foodsResult[0]) ? foodsResult[0] : foodsResult;
    }

    foods = foods.map(f => ({
      ...f,
      portion_grams: Number(f.portion_grams),
      calories: Number(f.calories),
      protein: Number(f.protein),
      carbs: Number(f.carbs),
      fats: Number(f.fats),
    }));

    console.log("✅ Specific foods found:", foods.length);
    return res.status(200).json(foods);

  } catch (error) {
    console.error("❌ Error fetching specific foods:", error);
    return res.status(500).json({ 
      error: "Server error", 
      message: error.message 
    });
  }
});


router.get("/food-choices/:rfid_tag", async (req, res) => {
  const { rfid_tag } = req.params;
  console.log("🍽️ Fetching food group choices for RFID:", rfid_tag);

  try {

    const result = await db.query(
      `SELECT protein_ids, carb_ids, fruit_ids, vegetable_ids
       FROM NutritionAssessment
       WHERE rfid_tag = ?
       ORDER BY id DESC
       LIMIT 1`,
      [rfid_tag]
    );

    let assessmentData = null;

    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && result[0].length > 0) {
        assessmentData = result[0][0];
      } else {
        assessmentData = result[0];
      }
    }

    if (!assessmentData) {
      console.log("⚠️ No nutrition assessment found for RFID:", rfid_tag);
      return res.status(200).json([]);
    }

    const proteinIds = Array.isArray(assessmentData.protein_ids)
      ? assessmentData.protein_ids
      : (assessmentData.protein_ids ? JSON.parse(assessmentData.protein_ids) : []);
    const carbIds = Array.isArray(assessmentData.carb_ids)
      ? assessmentData.carb_ids
      : (assessmentData.carb_ids ? JSON.parse(assessmentData.carb_ids) : []);
    const fruitIds = Array.isArray(assessmentData.fruit_ids)
      ? assessmentData.fruit_ids
      : (assessmentData.fruit_ids ? JSON.parse(assessmentData.fruit_ids) : []);
    const vegetableIds = Array.isArray(assessmentData.vegetable_ids)
      ? assessmentData.vegetable_ids
      : (assessmentData.vegetable_ids ? JSON.parse(assessmentData.vegetable_ids) : []);

    const foodGroups = [];

    const getGroupNames = async (idsArray, category) => {
      if (!idsArray || idsArray.length === 0) return [];
      const placeholders = idsArray.map(() => "?").join(",");
      const [groupRows] = await db.query(
        `SELECT name FROM FoodGroups WHERE id IN (${placeholders})`,
        [...idsArray]
      );
      return groupRows.map(g => ({ name: g.name, category }));
    };

    foodGroups.push(
      ...(await getGroupNames(proteinIds, "Protein")),
      ...(await getGroupNames(carbIds, "Carb")),
      ...(await getGroupNames(fruitIds, "Fruit")),
      ...(await getGroupNames(vegetableIds, "Vegetable"))
    );

    console.log("✅ Food group choices:", foodGroups);
    return res.status(200).json(foodGroups);

  } catch (error) {
    console.error("❌ Error fetching food group choices:", error);
    return res.status(500).json({ error: "Server error", message: error.message });
  }
});

module.exports = router;