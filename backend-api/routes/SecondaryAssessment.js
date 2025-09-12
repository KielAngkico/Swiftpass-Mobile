const express = require('express');
const router = express.Router();
const db = require('../db');

router.get("/exercise-assessment-status/:member_id", async (req, res) => {
  const member_id = parseInt(req.params.member_id, 10);
  try {
    const [rows] = await db.query(
      "SELECT id FROM ExerciseAssessments WHERE member_id = ? LIMIT 1",
      [member_id]
    );


    const assessmentExists = (Array.isArray(rows) && rows.length > 0) || (!!rows && rows.id);

    console.log("🧪 ExerciseAssessment rows:", rows);
    res.json({ completed: !!assessmentExists });
  } catch (error) {
    console.error("Error checking exercise assessment:", error);
    res.status(500).json({ error: "Server error" });
  }
});


router.get('/nutrition-assessment-status/:member_id', async (req, res) => {
  const { member_id } = req.params;
  try {
    const result = await db.query(
      `SELECT id, 
              CASE WHEN EXISTS (
                SELECT 1 FROM MemberNutritionResult WHERE member_id = ?
              ) THEN 1 ELSE 0 END AS completed
       FROM NutritionAssessment
       WHERE member_id = ?`,
      [member_id, member_id]
    );

    const assessment = Array.isArray(result) ? result[0] : result.rows[0];

    res.json({ completed: assessment?.completed === 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


router.get('/assessment/initial/:member_id', async (req, res) => {
  const member_id = parseInt(req.params.member_id, 10);
  if (isNaN(member_id)) return res.status(400).json({ error: 'Invalid member ID' });

  try {
    const rows = await db.query(
      'SELECT username, goal_type, calories_target FROM InitialAssessment WHERE member_id = ? LIMIT 1',
      [member_id]
    );
    console.log("Rows from initial assessment:", rows);
    if (rows.length > 0) {
      return res.json(rows[0]);
    } else {
      return res.status(404).json({ error: 'Initial assessment not found' });
    }
  } catch (err) {
    console.error('Error fetching initial assessment:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});




router.get("/food-groups", async (req, res) => {
  try {
    const rows = await db.query(
      "SELECT id, name, category, is_meat, is_red_meat FROM FoodGroups ORDER BY category, name"
    );
    res.json(rows);
  } catch (error) {
    console.error("❌ Error fetching food groups:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get('/food-library/best-specific/:food_group_id', async (req, res) => {
  const foodGroupId = parseInt(req.params.food_group_id, 10);
  console.log(`🔍 Looking for best food for group ID: ${foodGroupId}`);
  
  if (isNaN(foodGroupId)) {
    return res.status(400).json({ error: 'Invalid food group ID' });
  }

  try {

    const [fgRows] = await db.query(
      'SELECT id, name, category FROM FoodGroups WHERE id = ? LIMIT 1',
      [foodGroupId]
    );
    
    console.log(`📋 Food group query result for ID ${foodGroupId}:`, fgRows);
    
    const foodGroup = Array.isArray(fgRows) ? fgRows[0] : fgRows;
    
    if (!foodGroup || !foodGroup.id) {
      console.log(`❌ Food group ${foodGroupId} not found`);
      return res.status(404).json({ error: 'Food group not found' });
    }

    console.log(`✅ Found food group:`, foodGroup);
    const category = foodGroup.category.toLowerCase();

    let orderBy = '';
    if (category === 'protein') {
      orderBy = 'protein DESC, fats ASC, carbs ASC';
    } else if (category === 'carb') {
      orderBy = 'carbs DESC, protein ASC, fats ASC';
    } else if (category === 'fat') {
      orderBy = 'fats DESC, protein ASC, carbs ASC';
    } else {
      orderBy = 'protein DESC';
    }

    console.log(`🔄 Using order by: ${orderBy} for category: ${category}`);


    const [foodRows] = await db.query(
      `SELECT * FROM FoodLibrary WHERE group_id = ? ORDER BY ${orderBy} LIMIT 2`,
      [foodGroupId]
    );

    console.log(`🍎 Food library query result for group ${foodGroupId}:`, foodRows);

    const foods = Array.isArray(foodRows) ? foodRows : [foodRows];
    
    if (foods.length > 0 && foods[0] && foods[0].id) {
      console.log(`✅ Returning foods:`, foods);
      return res.json(foods);
    }


    console.log(`⚠️ No foods found for group ${foodGroupId}, returning fallback`);
    return res.json([
      {
        id: `${foodGroupId}_default`,
        name: `Best food for ${foodGroup.name}`,
        group_id: foodGroupId
      }
    ]);
  } catch (err) {
    console.error(`❌ Error fetching best specific food for group ${foodGroupId}:`, err);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.get("/food-library/group/:food_group_id", async (req, res) => {
  const foodGroupId = parseInt(req.params.food_group_id, 10);
  console.log(`🔍 Fetching all foods for group ID: ${foodGroupId}`);

  if (isNaN(foodGroupId)) {
    return res.status(400).json({ error: "Invalid food group ID" });
  }

  try {
    const result = await db.query(
      `SELECT 
         id, 
         name, 
         group_id, 
         grams_reference, 
         calories, 
         protein, 
         carbs, 
         fats 
       FROM FoodLibrary 
       WHERE group_id = ?`,
      [foodGroupId]
    );

    const foodRows = Array.isArray(result) ? result : [result];

    console.log(`🍽️ Final query result for group ${foodGroupId}:`, foodRows);

    if (foodRows.length > 0 && foodRows[0]?.id) {
      return res.json(foodRows);
    }

    console.log(`⚠️ No foods found for group ${foodGroupId}`);
    return res.json([]);
  } catch (err) {
    console.error(`❌ Error fetching foods for group ${foodGroupId}:`, err);
    return res.status(500).json({ error: "Server error" });
  }
});

router.get("/allergens", async (req, res) => {
  try {
    const rows = await db.query("SELECT * FROM Allergens ORDER BY name ASC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching allergens:", err);
    res.status(500).json({ error: "Failed to fetch allergens" });
  }
});



router.get('/macro-breakdown/:goal_type', async (req, res) => {
  const rawGoalType = req.params.goal_type;
  const goal_type = decodeURIComponent(rawGoalType).trim().toLowerCase();

  try {
    const result = await db.query(
      `SELECT id, protein_pct, carbs_pct, fats_pct 
       FROM MacroNutrientBreakdown 
       WHERE LOWER(TRIM(goal_type)) = ? 
       LIMIT 1`,
      [goal_type]
    );

    const rows = result[0]; 

    console.log("🔍 Query result for goal_type:", `"${goal_type}"`, rows);

    if (rows && rows.id) {
      res.json({
        id: rows.id,
        protein_pct: parseFloat(rows.protein_pct),
        carbs_pct: parseFloat(rows.carbs_pct),
        fats_pct: parseFloat(rows.fats_pct),
      });
    } else {
      console.warn("⚠️ No macro breakdown found for:", `"${goal_type}"`);
      res.status(404).json({ error: 'Macro breakdown not found' });
    }
  } catch (error) {
    console.error('❌ Error fetching macro breakdown:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.post('/nutrition/:member_id', async (req, res) => {
  const { member_id } = req.params;
  const { 
    rfid_tag, 
    allergens, 
    calories_target, 
    protein_grams, 
    carbs_grams, 
    fats_grams, 
    macro_breakdown_id, 
    food_preferences
  } = req.body;

  let assessmentId = null;

  try {
    if (!macro_breakdown_id) 
      return res.status(400).json({ error: "macro_breakdown_id is required" });

 
    let parsedAllergens = [];
    if (Array.isArray(allergens)) parsedAllergens = allergens;
    else if (typeof allergens === "string") {
      try { parsedAllergens = JSON.parse(allergens); } 
      catch { parsedAllergens = [allergens]; }
    }


    const selectedFoodIds = [];
    const foodIdsByMacro = {
      Protein: [],
      Carb: [],
      Fruit: [],
      Vegetable: []
    };

    if (Array.isArray(food_preferences)) {
      for (const fp of food_preferences) {
        if (!fp?.food_id || !fp?.macro_type) continue;
        const macro = fp.macro_type.trim();
        const foodId = parseInt(fp.food_id);
        
        selectedFoodIds.push(foodId);
        
        if (foodIdsByMacro[macro]) {
          foodIdsByMacro[macro].push(foodId);
        }
      }
    }

    console.log("User selected food IDs:", selectedFoodIds);
    console.log("Food IDs by macro:", foodIdsByMacro);

    const proteinIds = [];
    const carbIds = [];
    const fruitIds = [];
    const vegetableIds = [];

    if (Array.isArray(food_preferences)) {
      for (const fp of food_preferences) {
        if (!fp?.food_group_id || !fp?.macro_type) continue;
        const macro = fp.macro_type.trim();
        const id = parseInt(fp.food_group_id);
        if (macro === 'Protein') proteinIds.push(id);
        else if (macro === 'Carb') carbIds.push(id);
        else if (macro === 'Fruit') fruitIds.push(id);
        else if (macro === 'Vegetable') vegetableIds.push(id);
      }
    }

    const insertResult = await db.query(
      `INSERT INTO NutritionAssessment 
        (member_id, rfid_tag, allergens, protein_ids, carb_ids, fruit_ids, vegetable_ids, calories_target, protein_grams, carbs_grams, fats_grams, macro_breakdown_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        member_id, 
        rfid_tag, 
        JSON.stringify(parsedAllergens), 
        JSON.stringify(proteinIds), 
        JSON.stringify(carbIds), 
        JSON.stringify(fruitIds), 
        JSON.stringify(vegetableIds), 
        calories_target, 
        protein_grams, 
        carbs_grams, 
        fats_grams, 
        macro_breakdown_id
      ]
    );

    assessmentId = Array.isArray(insertResult) ? insertResult[0].insertId : insertResult.insertId;

  
    if (selectedFoodIds.length === 0) {
      console.log("No foods selected by user");
      return res.json({ 
        success: true, 
        assessment_id: assessmentId, 
        computed: false, 
        message: 'No foods selected' 
      });
    }

    const foodPlaceholders = selectedFoodIds.map(() => '?').join(',');

    const updatedQuery = `
      WITH macro_targets AS (
        SELECT 
          ? AS member_id,
          ? AS calories_target,
          ROUND(? * m.protein_pct / 100 / 4, 2) AS target_protein,
          ROUND(? * m.carbs_pct / 100 / 4, 2) AS target_carbs,
          ROUND(? * m.fats_pct / 100 / 9, 2) AS target_fats
        FROM MacroNutrientBreakdown m
        WHERE m.id = ?
      ),
      selected_foods AS (
        SELECT 
          fl.id AS food_id,
          fl.name AS food_name,
          fg.category AS food_category,
          COALESCE(fl.calories, 0) AS calories,
          COALESCE(fl.protein, 0) AS protein,
          COALESCE(fl.carbs, 0) AS carbs,
          COALESCE(fl.fats, 0) AS fats,
          fl.grams_reference,
          fg.id AS group_id
        FROM FoodLibrary fl
        JOIN FoodGroups fg ON fl.group_id = fg.id
        WHERE fl.id IN (${foodPlaceholders})
      ),
      macro_density AS (
        SELECT 
          sf.*,
          CASE 
            WHEN sf.food_category = 'Protein' THEN sf.protein / NULLIF(sf.calories, 0)
            WHEN sf.food_category IN ('Carb','Fruit','Vegetable') THEN sf.carbs / NULLIF(sf.calories, 0)
            ELSE 1
          END AS density
        FROM selected_foods sf
      ),
      category_totals AS (
        SELECT 
          food_category,
          SUM(density) AS total_density
        FROM macro_density
        GROUP BY food_category
      ),
      initial_portions AS (
        SELECT
          md.*,
          ct.total_density,
          CASE 
            WHEN md.food_category = 'Protein' THEN 
              ROUND((mt.target_protein * md.density / ct.total_density) / NULLIF(md.protein, 0) * md.grams_reference, 0)
            WHEN md.food_category = 'Carb' THEN 
              ROUND(((mt.target_carbs * 0.7) * md.density / 
                    (SELECT SUM(density) FROM macro_density WHERE food_category = 'Carb'))
                    / NULLIF(md.carbs, 0) * md.grams_reference, 0)
            WHEN md.food_category = 'Fruit' THEN 
              ROUND(((mt.target_carbs * 0.2) * md.density / 
                    (SELECT SUM(density) FROM macro_density WHERE food_category = 'Fruit'))
                    / NULLIF(md.carbs, 0) * md.grams_reference, 0)
            WHEN md.food_category = 'Vegetable' THEN 
              ROUND(((mt.target_carbs * 0.1) * md.density / 
                    (SELECT SUM(density) FROM macro_density WHERE food_category = 'Vegetable'))
                    / NULLIF(md.carbs, 0) * md.grams_reference, 0)
            ELSE md.grams_reference
          END AS portion_grams
        FROM macro_density md
        CROSS JOIN macro_targets mt
        JOIN category_totals ct ON md.food_category = ct.food_category
      ),
      pre_scaled AS (
        SELECT 
          *,
          ROUND(calories * portion_grams / grams_reference, 2) AS total_calories,
          ROUND(protein * portion_grams / grams_reference, 2) AS total_protein,
          ROUND(carbs * portion_grams / grams_reference, 2) AS total_carbs,
          ROUND(fats * portion_grams / grams_reference, 2) AS total_fats
        FROM initial_portions
      ),
      scaling_factor AS (
        SELECT (SELECT calories_target FROM macro_targets) / NULLIF(SUM(total_calories),0) AS scale
        FROM pre_scaled
      ),
      final_scaled AS (
        SELECT 
          ps.food_id,
          ps.food_name,
          ps.food_category,
          ps.calories,
          ps.protein,
          ps.carbs,
          ps.fats,
          CASE 
            WHEN ps.food_category IN ('Protein','Carb') THEN ROUND(ps.portion_grams * sf.scale / 50,0)*50
            WHEN ps.food_category = 'Fruit' THEN ROUND(ps.portion_grams * sf.scale / 10,0)*10
            WHEN ps.food_category = 'Vegetable' THEN LEAST(ROUND(ps.portion_grams * sf.scale / 10,0)*10, 250)
            ELSE ROUND(ps.portion_grams * sf.scale,0)
          END AS portion_grams,
          ROUND(ps.total_calories * sf.scale, 2) AS total_calories,
          ROUND(ps.total_protein * sf.scale, 2) AS total_protein,
          ROUND(ps.total_carbs * sf.scale, 2) AS total_carbs,
          ROUND(ps.total_fats * sf.scale, 2) AS total_fats,
          ps.group_id
        FROM pre_scaled ps
        CROSS JOIN scaling_factor sf
      )
      SELECT * FROM final_scaled
      ORDER BY food_category, food_name;
    `;

    const queryParams = [
      member_id,
      calories_target,
      protein_grams,
      carbs_grams,
      fats_grams,
      macro_breakdown_id,
      ...selectedFoodIds 
    ];

    console.log("Executing query with selected food IDs:", selectedFoodIds);
    console.log("Query parameters:", queryParams);

  
    const queryResult = await db.query(updatedQuery, queryParams);

    console.log("Raw query result:", queryResult);

    const scaledResults = queryResult;

    console.log("Processed scaledResults:", scaledResults);
    console.log("scaledResults length:", scaledResults?.length);

    if (!scaledResults || !Array.isArray(scaledResults) || scaledResults.length === 0) {
      console.log("No foods found matching user selections");
      return res.json({ 
        success: true, 
        assessment_id: assessmentId, 
        computed: false, 
        message: 'No foods found matching your selected preferences' 
      });
    }

    console.log("About to insert", scaledResults.length, "food results");

    await db.query(`DELETE FROM MemberNutritionResult WHERE assessment_id = ?`, [assessmentId]);

    const insertPromises = scaledResults.map(f => {
      console.log("Inserting food:", f.food_name, "with values:", {
        assessment_id: assessmentId,
        member_id: member_id,
        food_id: f.food_id,
        group_id: f.group_id,
        portion_grams: f.portion_grams,
        calories: f.total_calories,
        protein: f.total_protein,
        carbs: f.total_carbs,
        fats: f.total_fats,
        food_name: f.food_name,
        macro_type: f.food_category
      });
      
      return db.query(
        `INSERT INTO MemberNutritionResult 
          (assessment_id, member_id, food_id, group_id, portion_grams, calories, protein, carbs, fats, food_name, macro_type)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          assessmentId,
          member_id,
          f.food_id,
          f.group_id,
          f.portion_grams,
          f.total_calories,
          f.total_protein,
          f.total_carbs,
          f.total_fats,
          f.food_name,
          f.food_category
        ]
      );
    });

    await Promise.all(insertPromises);

    console.log("Successfully inserted all nutrition results for user-selected foods");

    res.json({ 
      success: true, 
      assessment_id: assessmentId, 
      computed: true, 
      foods: scaledResults,
      message: `Successfully computed nutrition for ${scaledResults.length} selected foods`
    });

  } catch (error) {
    console.error("❌ Error saving nutrition assessment:", error);
    if (assessmentId) {
      try {
        await db.query(`DELETE FROM NutritionAssessment WHERE id = ?`, [assessmentId]);
      } catch (deleteError) {
        console.error("Error cleaning up assessment:", deleteError);
      }
    }
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});


router.post('/nutrition-result/generate/:assessment_id', async (req, res) => {
  const assessment_id = parseInt(req.params.assessment_id, 10);
  const { member_id } = req.body;

  if (isNaN(assessment_id) || !member_id) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    const workingQuery = `
      WITH Params AS (
        SELECT ? AS member_id
      ),
      Assessment AS (
        SELECT 
          a.member_id,
          a.calories_target,
          a.macro_breakdown_id,
          a.protein_ids,
          a.carb_ids,
          a.fat_ids
        FROM NutritionAssessment a
        JOIN Params p ON p.member_id = a.member_id
        WHERE a.id = ?
      ),
      Targets AS (
        SELECT 
          a.member_id,
          a.calories_target,
          ROUND((mb.protein_pct / 100) * a.calories_target / 4, 1) AS protein_grams,
          ROUND((mb.carbs_pct / 100) * a.calories_target / 4, 1) AS carbs_grams,
          ROUND((mb.fats_pct / 100) * a.calories_target / 9, 1) AS fats_grams
        FROM Assessment a
        JOIN MacroNutrientBreakdown mb ON mb.id = a.macro_breakdown_id
      ),
      BestProtein AS (
        SELECT f.id, f.name, f.group_id, f.protein, f.carbs, f.fats
        FROM FoodLibrary f
        JOIN FoodGroups fg ON fg.id = f.group_id
        JOIN Assessment a ON JSON_CONTAINS(a.protein_ids, CAST(fg.id AS JSON), '$')
        WHERE fg.category = 'Protein'
        ORDER BY f.protein DESC, f.fats ASC
        LIMIT 2
      ),
      BestCarb AS (
        SELECT f.id, f.name, f.group_id, f.protein, f.carbs, f.fats
        FROM FoodLibrary f
        JOIN FoodGroups fg ON fg.id = f.group_id
        JOIN Assessment a ON JSON_CONTAINS(a.carb_ids, CAST(fg.id AS JSON), '$')
        WHERE fg.category = 'Carb'
        ORDER BY f.carbs DESC, f.fats ASC
        LIMIT 2
      ),
      BestFat AS (
        SELECT f.id, f.name, f.group_id, f.protein, f.carbs, f.fats
        FROM FoodLibrary f
        JOIN FoodGroups fg ON fg.id = f.group_id
        JOIN Assessment a ON JSON_CONTAINS(a.fat_ids, CAST(fg.id AS JSON), '$')
        WHERE fg.category = 'Fat'
        ORDER BY f.fats DESC
        LIMIT 1
      ),
      SelectedFoods AS (
        SELECT * FROM BestProtein
        UNION ALL
        SELECT * FROM BestCarb
        UNION ALL
        SELECT * FROM BestFat
      ),
      RawTotals AS (
        SELECT 
          SUM(COALESCE(protein,0)) AS sum_protein,
          SUM(COALESCE(carbs,0)) AS sum_carbs,
          SUM(COALESCE(fats,0)) AS sum_fats
        FROM SelectedFoods
      ),
      Scaling AS (
        SELECT
          t.member_id,
          t.calories_target,
          t.protein_grams,
          t.carbs_grams,
          t.fats_grams,
          CASE WHEN r.sum_protein > 0 THEN t.protein_grams / r.sum_protein ELSE 1 END AS protein_scale,
          CASE WHEN r.sum_carbs > 0 THEN t.carbs_grams / r.sum_carbs ELSE 1 END AS carbs_scale,
          CASE WHEN r.sum_fats > 0 THEN t.fats_grams / r.sum_fats ELSE 1 END AS fats_scale
        FROM Targets t
        CROSS JOIN RawTotals r
      ),
      FoodsWithMacroType AS (
        SELECT 
          f.*,
          fg.name AS food_group,
          CASE
            WHEN JSON_CONTAINS(a.protein_ids, CAST(fg.id AS JSON), '$') THEN 'Protein'
            WHEN JSON_CONTAINS(a.carb_ids, CAST(fg.id AS JSON), '$') THEN 'Carb'
            WHEN JSON_CONTAINS(a.fat_ids, CAST(fg.id AS JSON), '$') THEN 'Fat'
          END AS macro_type
        FROM SelectedFoods f
        JOIN FoodGroups fg ON fg.id = f.group_id
        JOIN Assessment a ON a.member_id = ?
      ),
      ScaledFoods AS (
        SELECT 
          f.id,
          f.name,
          f.food_group,
          f.macro_type,
          f.group_id,
          ROUND(
            CASE 
              WHEN f.macro_type = 'Protein' THEN 100 * s.protein_scale
              WHEN f.macro_type = 'Carb' THEN 100 * s.carbs_scale
              WHEN f.macro_type = 'Fat' THEN 100 * s.fats_scale
            END, 0
          ) AS portion_grams,
          ROUND(COALESCE(f.protein,0) * 
            CASE 
              WHEN f.macro_type = 'Protein' THEN s.protein_scale
              WHEN f.macro_type = 'Carb' THEN s.carbs_scale
              WHEN f.macro_type = 'Fat' THEN s.fats_scale
            END, 1) AS total_protein,
          ROUND(COALESCE(f.carbs,0) * 
            CASE 
              WHEN f.macro_type = 'Protein' THEN s.protein_scale
              WHEN f.macro_type = 'Carb' THEN s.carbs_scale
              WHEN f.macro_type = 'Fat' THEN s.fats_scale
            END, 1) AS total_carbs,
          ROUND(COALESCE(f.fats,0) * 
            CASE 
              WHEN f.macro_type = 'Protein' THEN s.protein_scale
              WHEN f.macro_type = 'Carb' THEN s.carbs_scale
              WHEN f.macro_type = 'Fat' THEN s.fats_scale
            END, 1) AS total_fats,
          ROUND(
            (COALESCE(f.protein,0) * 
              CASE 
                WHEN f.macro_type = 'Protein' THEN s.protein_scale
                WHEN f.macro_type = 'Carb' THEN s.carbs_scale
                WHEN f.macro_type = 'Fat' THEN s.fats_scale
              END * 4) +
            (COALESCE(f.carbs,0) * 
              CASE 
                WHEN f.macro_type = 'Protein' THEN s.protein_scale
                WHEN f.macro_type = 'Carb' THEN s.carbs_scale
                WHEN f.macro_type = 'Fat' THEN s.fats_scale
              END * 4) +
            (COALESCE(f.fats,0) * 
              CASE 
                WHEN f.macro_type = 'Protein' THEN s.protein_scale
                WHEN f.macro_type = 'Carb' THEN s.carbs_scale
                WHEN f.macro_type = 'Fat' THEN s.fats_scale
              END * 9)
          , 0) AS total_calories
        FROM FoodsWithMacroType f
        CROSS JOIN Scaling s
      )
      SELECT * FROM ScaledFoods
      ORDER BY macro_type, name
    `;

    const queryResult = await db.query(workingQuery, [member_id, assessment_id, member_id]);

    let scaledResults;
    if (Array.isArray(queryResult)) {
      if (queryResult.length > 0 && queryResult[0] && typeof queryResult[0] === 'object' && queryResult[0].id) {
        scaledResults = queryResult;
      } else {
        scaledResults = queryResult[0];
      }
    } else if (queryResult && queryResult.rows) {
      scaledResults = queryResult.rows;
    } else {
      scaledResults = queryResult;
    }

    if (!scaledResults || !Array.isArray(scaledResults) || scaledResults.length === 0) {
      return res.status(404).json({ error: "No results generated" });
    }
    await db.query(`DELETE FROM MemberNutritionResult WHERE assessment_id = ?`, [assessment_id]);

    const insertPromises = scaledResults.map(food => {
      return db.query(
        `INSERT INTO MemberNutritionResult 
          (assessment_id, member_id, food_id, group_id, portion_grams, calories, protein, carbs, fats, food_name, macro_type) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [assessment_id, member_id, food.id, food.group_id, food.portion_grams, 
         food.total_calories, food.total_protein, food.total_carbs, food.total_fats, 
         food.name, food.macro_type]
      );
    });

    await Promise.all(insertPromises);

    res.json({ 
      success: true, 
      assessment_id,
      message: "Nutrition results computed using CTE query"
    });

  } catch (error) {
    console.error(`❌ Error generating CTE nutrition results:`, error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

router.get('/nutrition-result/:assessment_id', async (req, res) => {
  const assessment_id = parseInt(req.params.assessment_id, 10);

  if (isNaN(assessment_id)) {
    return res.status(400).json({ error: "Invalid assessment ID" });
  }

  try {
    const [results] = await db.query(
      `SELECT * FROM MemberNutritionResult WHERE assessment_id = ? ORDER BY macro_type, food_name`,
      [assessment_id]
    );

    if (!results || results.length === 0) {
      return res.status(404).json({ error: "No nutrition results found" });
    }

    const summary = {
      total_foods: results.length,
      total_calories: results.reduce((sum, food) => sum + (food.calories || 0), 0),
      total_protein: Math.round(results.reduce((sum, food) => sum + (food.protein || 0), 0) * 10) / 10,
      total_carbs: Math.round(results.reduce((sum, food) => sum + (food.carbs || 0), 0) * 10) / 10,
      total_fats: Math.round(results.reduce((sum, food) => sum + (food.fats || 0), 0) * 10) / 10,
      foods: results
    };

    res.json(summary);

  } catch (error) {
    console.error(`❌ Error fetching nutrition results:`, error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/splits/days/:days", async (req, res) => {
  const { days } = req.params;

  if (!days || isNaN(days)) {
    return res.status(400).json({ error: "Invalid workout days parameter" });
  }

  try {
    const result = await db.query(
      "SELECT id, split_name, workout_days, target_gender FROM SplitLibrary WHERE workout_days = ? ORDER BY split_name",
      [parseInt(days)]
    );

    let rows;
    if (Array.isArray(result)) {
      rows = result;
    } else if (result && Array.isArray(result[0])) {
      rows = result[0];
    } else if (result && result.rows) {
      rows = result.rows;
    } else {
      rows = [];
    }

    res.json(Array.isArray(rows) ? rows : []);
  } catch (error) {
    console.error("❌ Error fetching splits by days:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/exercise-plan/preview", async (req, res) => {
  const { split_name } = req.query;

  if (!split_name) {
    return res.status(400).json({ error: "Split name is required" });
  }

  try {
    const splitResult = await db.query(
      "SELECT id, split_name, workout_days FROM SplitLibrary WHERE split_name = ?",
      [split_name]
    );

    let splitRows;
    if (Array.isArray(splitResult)) {
      splitRows = splitResult;
    } else if (splitResult && Array.isArray(splitResult[0])) {
      splitRows = splitResult[0];
    } else if (splitResult && splitResult.rows) {
      splitRows = splitResult.rows;
    } else {
      splitRows = [];
    }

    if (!splitRows || splitRows.length === 0) {
      return res.status(404).json({ error: "Split not found" });
    }

    const split = splitRows[0];

    const daysResult = await db.query(
      `SELECT sd.day_number, sd.day_title, sd.id as day_id
       FROM SplitDays sd 
       WHERE sd.split_id = ? 
       ORDER BY sd.day_number`,
      [split.id]
    );

    let daysRows;
    if (Array.isArray(daysResult)) {
      daysRows = daysResult;
    } else if (daysResult && Array.isArray(daysResult[0])) {
      daysRows = daysResult[0];
    } else if (daysResult && daysResult.rows) {
      daysRows = daysResult.rows;
    } else {
      daysRows = [];
    }

    const days = await Promise.all(
      daysRows.map(async (day) => {
        const exercisesResult = await db.query(
          `SELECT 
             e.id,
             e.name,
             e.muscle_group,
             e.equipment,
             e.instructions,
             e.level,
             e.exercise_type,
             sde.order_index
           FROM SplitDayExercises sde
           JOIN ExerciseLibrary e ON sde.exercise_id = e.id
           WHERE sde.split_day_id = ?
           ORDER BY sde.order_index ASC`,
          [day.day_id]
        );

        let exercisesRows;
        if (Array.isArray(exercisesResult)) {
          exercisesRows = exercisesResult;
        } else if (exercisesResult && Array.isArray(exercisesResult[0])) {
          exercisesRows = exercisesResult[0];
        } else if (exercisesResult && exercisesResult.rows) {
          exercisesRows = exercisesResult.rows;
        } else {
          exercisesRows = [];
        }

        return {
          day_number: day.day_number,
          day_title: day.day_title,
          exercises: exercisesRows || []
        };
      })
    );

    const response = {
      split_name: split.split_name,
      workout_days: split.workout_days,
      days: days
    };

    res.json(response);

  } catch (error) {
    console.error("❌ Error fetching exercise preview:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

router.post('/exercise/:member_id', async (req, res) => {
  const { member_id } = req.params;
  const { 
    rfid_tag, 
    admin_id, 
    fitness_level, 
    workout_days, 
    assigned_split_name, 
    coach_notes,
    status = 'confirmed'
  } = req.body;

  if (!member_id || !rfid_tag || !fitness_level || !workout_days || !assigned_split_name) {
    return res.status(400).json({ 
      error: "Missing required fields", 
      required: ["member_id", "rfid_tag", "fitness_level", "workout_days", "assigned_split_name"]
    });
  }

  try {

    const memberResult = await db.query(
      "SELECT id FROM MembersAccounts WHERE id = ? AND rfid_tag = ?",
      [member_id, rfid_tag]
    );

    let memberRows;
    if (Array.isArray(memberResult)) {
      memberRows = memberResult;
    } else if (memberResult && Array.isArray(memberResult[0])) {
      memberRows = memberResult[0];
    } else if (memberResult && memberResult.rows) {
      memberRows = memberResult.rows;
    } else {
      memberRows = [];
    }

    if (!memberRows || memberRows.length === 0) {
      return res.status(404).json({ error: "Member not found or RFID mismatch" });
    }

    const splitResult = await db.query(
      "SELECT id FROM SplitLibrary WHERE split_name = ?",
      [assigned_split_name]
    );

    let splitRows;
    if (Array.isArray(splitResult)) {
      splitRows = splitResult;
    } else if (splitResult && Array.isArray(splitResult[0])) {
      splitRows = splitResult[0];
    } else if (splitResult && splitResult.rows) {
      splitRows = splitResult.rows;
    } else {
      splitRows = [];
    }

    if (!splitRows || splitRows.length === 0) {
      return res.status(404).json({ error: "Selected split plan not found" });
    }

 
    await db.query(
      "DELETE FROM ExerciseAssessments WHERE member_id = ?",
      [member_id]
    );


    const insertResult = await db.query(
      `INSERT INTO ExerciseAssessments
       (member_id, rfid_tag, admin_id, fitness_level, workout_days, assigned_split_name, coach_notes, status, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        parseInt(member_id), 
        rfid_tag, 
        admin_id || null, 
        fitness_level.toLowerCase(), 
        parseInt(workout_days), 
        assigned_split_name, 
        coach_notes || null,
        status
      ]
    );

    let result;
    if (Array.isArray(insertResult)) {
      result = insertResult[0];
    } else if (insertResult && insertResult[0]) {
      result = insertResult[0];
    } else {
      result = insertResult;
    }

    res.json({ 
      success: true, 
      assessment_id: result.insertId,
      message: "Exercise assessment saved successfully",
      data: {
        member_id: parseInt(member_id),
        split_name: assigned_split_name,
        workout_days: parseInt(workout_days),
        fitness_level: fitness_level.toLowerCase(),
        status: status
      }
    });

  } catch (error) {
    console.error('❌ Error saving exercise assessment:', error);
    res.status(500).json({ 
      error: "Internal server error", 
      details: error.message 
    });
  }
});


router.get("/results-routes/:rfid_tag", async (req, res) => {
  const { rfid_tag } = req.params;

  try {

    const assessmentResult = await db.query(
      `SELECT 
         ea.id,
         ea.member_id,
         ea.fitness_level,
         ea.workout_days,
         ea.assigned_split_name,
         ea.coach_notes,
         ea.status,
         ea.completed_at
       FROM ExerciseAssessments ea
       WHERE ea.rfid_tag = ?
       ORDER BY ea.completed_at DESC
       LIMIT 1`,
      [rfid_tag]
    );

    let assessmentRows;
    if (Array.isArray(assessmentResult)) {
      assessmentRows = assessmentResult;
    } else if (assessmentResult && Array.isArray(assessmentResult[0])) {
      assessmentRows = assessmentResult[0];
    } else {
      assessmentRows = [];
    }

    if (!assessmentRows || assessmentRows.length === 0) {
      return res.status(404).json({ error: "No exercise assessment found" });
    }

    const assessment = assessmentRows[0];

    const splitResult = await db.query(
      "SELECT id, split_name, workout_days FROM SplitLibrary WHERE split_name = ?",
      [assessment.assigned_split_name]
    );

    let splitRows;
    if (Array.isArray(splitResult)) {
      splitRows = splitResult;
    } else if (splitResult && Array.isArray(splitResult[0])) {
      splitRows = splitResult[0];
    } else {
      splitRows = [];
    }

    if (!splitRows || splitRows.length === 0) {
      return res.status(404).json({ error: "Split not found" });
    }

    const split = splitRows[0];

    const daysResult = await db.query(
      `SELECT sd.day_number, sd.day_title, sd.id as day_id
       FROM SplitDays sd 
       WHERE sd.split_id = ? 
       ORDER BY sd.day_number`,
      [split.id]
    );

    let daysRows;
    if (Array.isArray(daysResult)) {
      daysRows = daysResult;
    } else if (daysResult && Array.isArray(daysResult[0])) {
      daysRows = daysResult[0];
    } else {
      daysRows = [];
    }

    const workoutPlan = {};

    for (const day of daysRows) {
      const exercisesResult = await db.query(
        `SELECT 
           e.id,
           e.name,
           e.muscle_group,
           e.equipment,
           e.instructions,
           e.level,
           e.exercise_type,
           sde.order_index
         FROM SplitDayExercises sde
         JOIN ExerciseLibrary e ON sde.exercise_id = e.id
         WHERE sde.split_day_id = ?
         ORDER BY sde.order_index ASC`,
        [day.day_id]
      );

      let exercisesRows;
      if (Array.isArray(exercisesResult)) {
        exercisesRows = exercisesResult;
      } else if (exercisesResult && Array.isArray(exercisesResult[0])) {
        exercisesRows = exercisesResult[0];
      } else {
        exercisesRows = [];
      }

      workoutPlan[day.day_title] = exercisesRows || [];
    }

    res.json({
      assessment: {
        id: assessment.id,
        member_id: assessment.member_id,
        fitness_level: assessment.fitness_level,
        workout_days: assessment.workout_days,
        assigned_split_name: assessment.assigned_split_name,
        coach_notes: assessment.coach_notes,
        status: assessment.status,
        completed_at: assessment.completed_at
      },
      workoutPlan: workoutPlan
    });

  } catch (error) {
    console.error("❌ Error fetching workout plan:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

router.get("/exercise-completed-days/:rfid_tag", async (req, res) => {
  const { rfid_tag } = req.params;

  try {
    const completedResult = await db.query(
      `SELECT DISTINCT 
         DATE(completion_date) as completion_date,
         split_name
       FROM ExerciseDayCompletions 
       WHERE rfid_tag = ?
       ORDER BY completion_date DESC`,
      [rfid_tag]
    );

    let completedRows;
    if (Array.isArray(completedResult)) {
      completedRows = completedResult;
    } else if (completedResult && Array.isArray(completedResult[0])) {
      completedRows = completedResult[0];
    } else {
      completedRows = [];
    }


    const completedDays = {};
    completedRows.forEach(row => {
      const dateKey = row.completion_date.toISOString().split('T')[0];
      completedDays[dateKey] = row.split_name;
    });

    res.json(completedDays);

  } catch (error) {
    console.error("❌ Error fetching completed days:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

router.post("/exercise-day-complete", async (req, res) => {
  const { rfid_tag, split_name, completion_date } = req.body;

  if (!rfid_tag || !split_name || !completion_date) {
    return res.status(400).json({ 
      error: "Missing required fields", 
      required: ["rfid_tag", "split_name", "completion_date"]
    });
  }

  try {
 
    const memberResult = await db.query(
      "SELECT id FROM MembersAccounts WHERE rfid_tag = ?",
      [rfid_tag]
    );

    let memberRows;
    if (Array.isArray(memberResult)) {
      memberRows = memberResult;
    } else if (memberResult && Array.isArray(memberResult[0])) {
      memberRows = memberResult[0];
    } else {
      memberRows = [];
    }

    if (!memberRows || memberRows.length === 0) {
      return res.status(404).json({ error: "Member not found" });
    }

    const member_id = memberRows[0].id;

    const existingResult = await db.query(
      `SELECT id FROM ExerciseDayCompletions 
       WHERE rfid_tag = ? AND split_name = ? AND DATE(completion_date) = ?`,
      [rfid_tag, split_name, completion_date]
    );

    let existingRows;
    if (Array.isArray(existingResult)) {
      existingRows = existingResult;
    } else if (existingResult && Array.isArray(existingResult[0])) {
      existingRows = existingResult[0];
    } else {
      existingRows = [];
    }

    if (existingRows && existingRows.length > 0) {
      return res.json({ 
        success: true, 
        message: "Workout already marked as complete for this date",
        already_completed: true
      });
    }

    const insertResult = await db.query(
      `INSERT INTO ExerciseDayCompletions
       (member_id, rfid_tag, split_name, completion_date, completed_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [member_id, rfid_tag, split_name, completion_date]
    );

    let result;
    if (Array.isArray(insertResult)) {
      result = insertResult[0];
    } else if (insertResult && insertResult[0]) {
      result = insertResult[0];
    } else {
      result = insertResult;
    }

    res.json({ 
      success: true, 
      message: "Workout marked as complete successfully",
      completion_id: result.insertId
    });

  } catch (error) {
    console.error("❌ Error marking workout complete:", error);
    res.status(500).json({ error: "Internal server error", details: error.message });
  }
});

module.exports = router;