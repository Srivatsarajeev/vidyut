import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import pickle

# Load dataset
data = pd.read_csv("../data/energy.csv")

# Features & target
X = data[['temperature', 'humidity', 'appliance_usage']]
y = data['energy_consumption']

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

# Model
model = RandomForestRegressor()
model.fit(X_train, y_train)

# Save model
pickle.dump(model, open("model.pkl", "wb"))

print("Model trained successfully!")