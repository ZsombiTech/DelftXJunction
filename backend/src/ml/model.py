import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import mean_squared_error
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense
from tensorflow.keras.optimizers import Adam
from datetime import datetime
from math import radians, sin, cos, sqrt, atan2
import matplotlib.pyplot as plt


eats_orders = pd.read_csv('src/ml/train_data/eats_orders.csv')
weather_daily = pd.read_csv('src/ml/train_data/weather_daily.csv')
cancellation_rates = pd.read_csv('src/ml/train_data/cancellation_rates.csv')
merchants = pd.read_csv('src/ml/train_data/merchants.csv')
heatmap = pd.read_csv('src/ml/train_data/heatmap.csv') 


eats_orders['start_time'] = pd.to_datetime(eats_orders['start_time'])
eats_orders['hour'] = eats_orders['start_time'].dt.hour
eats_orders['dayofweek'] = eats_orders['start_time'].dt.dayofweek

eats_orders['eph'] = eats_orders['net_earnings'] / (eats_orders['duration_mins'] / 60.0)

eats_orders = eats_orders.merge(weather_daily, on=['date', 'city_id'], how='left')

eats_orders = eats_orders.merge(cancellation_rates.rename(columns={'hexagon_id9': 'pickup_hex_id9'}), 
                                on=['city_id', 'pickup_hex_id9'], how='left')

eats_orders['cancellation_rate_pct'].fillna(0, inplace=True)
eats_orders['weather'].fillna('clear', inplace=True)


features = ['city_id', 'hour', 'dayofweek', 'weather', 'cancellation_rate_pct', 'pickup_lat', 'pickup_lon']
target = 'eph'

X = eats_orders[features]
y = eats_orders[target]

cat_features = ['city_id', 'dayofweek', 'weather']
onehot = OneHotEncoder(sparse_output=False, handle_unknown='ignore')
X_cat = onehot.fit_transform(X[cat_features])

num_features = ['hour', 'cancellation_rate_pct', 'pickup_lat', 'pickup_lon']
scaler = StandardScaler()
X_num = scaler.fit_transform(X[num_features])

X_processed = np.hstack([X_cat, X_num])

X_train, X_test, y_train, y_test = train_test_split(X_processed, y, test_size=0.2, random_state=42)

input_dim = X_processed.shape[1]
model = Sequential([
    Dense(128, activation='relu', input_shape=(input_dim,)),
    Dense(64, activation='relu'),
    Dense(32, activation='relu'),
    Dense(1)  # Regression output for eph
])

model.compile(optimizer=Adam(learning_rate=0.001), loss='mse', metrics=['mae'])


history = model.fit(X_train, y_train, epochs=50, batch_size=32, validation_split=0.2, verbose=1)

test_loss, test_mae = model.evaluate(X_test, y_test)
print(f'Test MAE: {test_mae}')

plt.figure(figsize=(10, 6))
plt.plot(history.history['loss'], label='Training Loss', color='blue', linestyle='--', marker='o')
plt.plot(history.history['val_loss'], label='Validation Loss', color='orange', linestyle='-', marker='x')
plt.title('Training and Validation Loss Over Epochs', fontsize=16, fontweight='bold')
plt.xlabel('Epochs', fontsize=12)
plt.ylabel('Mean Squared Error (MSE)', fontsize=12)
plt.legend(loc='upper right', fontsize=10)
plt.grid(True, linestyle='--', alpha=0.7)
plt.tight_layout()
plt.savefig('training_validation_loss.png')
plt.show()

plt.figure(figsize=(10, 6))
plt.plot(history.history['mae'], label='Training MAE', color='green', linestyle='--', marker='s')
plt.plot(history.history['val_mae'], label='Validation MAE', color='red', linestyle='-', marker='d')
plt.title('Training and Validation MAE Over Epochs', fontsize=16, fontweight='bold')
plt.xlabel('Epochs', fontsize=12)
plt.ylabel('Mean Absolute Error (MAE)', fontsize=12)
plt.legend(loc='upper right', fontsize=10)
plt.grid(True, linestyle='--', alpha=0.7)
plt.tight_layout()
plt.savefig('training_validation_mae.png')
plt.show()

y_pred = model.predict(X_test).flatten()
plt.figure(figsize=(10, 6))
plt.scatter(y_test, y_pred, alpha=0.6, color='purple', edgecolor='k')
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'r--', lw=2)
plt.title('Predicted vs Actual Earnings Per Hour (EPH)', fontsize=16, fontweight='bold')
plt.xlabel('Actual EPH', fontsize=12)
plt.ylabel('Predicted EPH', fontsize=12)
plt.grid(True, linestyle='--', alpha=0.7)
plt.tight_layout()
plt.savefig('predicted_vs_actual.png')
plt.show()

residuals = y_test - y_pred
plt.figure(figsize=(10, 6))
plt.scatter(y_pred, residuals, alpha=0.6, color='teal', edgecolor='k')
plt.axhline(0, color='red', linestyle='--', lw=2)
plt.title('Residual Plot: Predicted EPH vs Residuals', fontsize=16, fontweight='bold')
plt.xlabel('Predicted EPH', fontsize=12)
plt.ylabel('Residuals', fontsize=12)
plt.grid(True, linestyle='--', alpha=0.7)
plt.tight_layout()
plt.savefig('residual_plot.png')
plt.show()

plt.figure(figsize=(10, 6))
plt.hist(residuals, bins=30, color='skyblue', edgecolor='black')
plt.title('Histogram of Residuals', fontsize=16, fontweight='bold')
plt.xlabel('Residuals', fontsize=12)
plt.ylabel('Frequency', fontsize=12)
plt.grid(True, linestyle='--', alpha=0.7)
plt.tight_layout()
plt.savefig('residuals_histogram.png')
plt.show()


def haversine(lat1, lon1, lat2, lon2):
    R = 6371  # Earth radius in km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    return R * c

def predict_best_location(current_lat, current_lon, current_time, model, onehot, scaler):
    hour = current_time.hour
    dayofweek = current_time.weekday()
    date_str = current_time.strftime('%Y-%m-%d')
    
    weather = 'clear'

    best_hex = None
    max_net_eph = -np.inf
    
    for _, merchant in merchants.iterrows():
        city_id = merchant['city_id']
        target_lat = merchant['lat']
        target_lon = merchant['lon']
        hex_id = merchant['hex_id9']
        

        cancel_row = cancellation_rates[(cancellation_rates['city_id'] == city_id) & 
                                        (cancellation_rates['hexagon_id9'] == hex_id)]
        cancel_rate = cancel_row['cancellation_rate_pct'].values[0] if not cancel_row.empty else 0
        
        # Prepare input
        input_df = pd.DataFrame({
            'city_id': [city_id],
            'hour': [hour],
            'dayofweek': [dayofweek],
            'weather': [weather],
            'cancellation_rate_pct': [cancel_rate],
            'pickup_lat': [target_lat],
            'pickup_lon': [target_lon]
        })
        
        input_cat = onehot.transform(input_df[cat_features])
        input_num = scaler.transform(input_df[num_features])
        input_processed = np.hstack([input_cat, input_num])
    
        predicted_eph = model.predict(input_processed)[0][0]
        
        distance_km = haversine(current_lat, current_lon, target_lat, target_lon)
        
        travel_time_hours = distance_km / 20.0
        
        net_eph = predicted_eph - (travel_time_hours * 10)
        
        if net_eph > max_net_eph:
            max_net_eph = net_eph
            best_hex = hex_id
    
    return best_hex, max_net_eph
