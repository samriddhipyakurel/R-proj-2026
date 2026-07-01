# api.R
# Load necessary libraries
library(plumber)
library(randomForest)

# Load the saved Random Forest model
# Note: You must run saveRDS(rf_model, "rf_model.rds") in your main script first!
model_path <- "rf_model.rds"
if (file.exists(model_path)) {
  rf_model <- readRDS(model_path)
} else {
  stop("Model file 'rf_model.rds' not found! Please export the model using saveRDS() first.")
}

#* @filter cors
function(req, res) {
  # This filter enables CORS (Cross-Origin Resource Sharing)
  # It allows your frontend website (running on a local file path) 
  # to talk to this R backend without security errors.
  res$setHeader("Access-Control-Allow-Origin", "*")
  res$setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  res$setHeader("Access-Control-Allow-Headers", "Content-Type")
  
  if (req$REQUEST_METHOD == "OPTIONS") {
    res$status <- 200
    return(list())
  }
  plumber::forward()
}

#* @apiTitle TrendSeer Backend Model
#* @apiDescription R backend API that serves predictions from the Random Forest model

#* Predict if a fashion product will be trending
#* @post /predict
function(req, res) {
  # Parse the incoming JSON body from the frontend
  body <- req$body
  
  # Safely extract variables from the frontend request, with fallbacks
  price_val <- as.numeric(body$price_usd)
  if (is.na(price_val)) price_val <- 50
  
  brand_val <- as.character(body$brand)
  if (is.null(brand_val) || brand_val == "") brand_val <- "Other"
  
  cat_val <- as.character(body$individual_category)
  if (is.null(cat_val) || cat_val == "") cat_val <- "Jeans"
  
  gender_val <- as.character(body$gender)
  if (is.null(gender_val) || gender_val == "") gender_val <- "Women"
  
  # Defaulting to US market since that's where our training data came from
  market_val <- "US"
  
  # --- Bulletproof Factor Creation ---
  # randomForest strictly requires new data to have the EXACT same factor levels 
  # (categories) as the training data. If we pass a brand like "Zara" but it was 
  # lumped into "Other" during training, it will crash.
  
  new_data <- data.frame(
    price_usd = price_val,
    # factor() safely maps the string to a level, or returns NA if it doesn't exist
    brand = factor(brand_val, levels = rf_model$forest$xlevels$brand),
    individual_category = factor(cat_val, levels = rf_model$forest$xlevels$individual_category),
    gender = factor(gender_val, levels = rf_model$forest$xlevels$gender),
    source_market = factor(market_val, levels = rf_model$forest$xlevels$source_market)
  )
  
  # If the brand or category wasn't recognized (became NA), default it to "Other"
  if (is.na(new_data$brand)) new_data$brand <- "Other"
  if (is.na(new_data$individual_category)) new_data$individual_category <- "Other"
  
  # Run the prediction using our trained model!
  pred_class <- predict(rf_model, new_data)
  pred_prob <- predict(rf_model, new_data, type = "prob")
  
  # Return the result back to the frontend as JSON
  list(
    # Whether it predicts Class 0 or Class 1
    prediction = as.numeric(as.character(pred_class)),
    # The probability of it being Class 1 (Trending)
    confidence = pred_prob[1, "1"] 
  )
}
