import streamlit as st
import requests

st.set_page_config(page_title="Vidyut ⚡", layout="centered")

st.title("⚡ Vidyut - Energy Consumption Predictor")

st.write("Enter environmental and usage details:")

# Inputs
temperature = st.slider("Temperature (°C)", 20, 45, 30)
humidity = st.slider("Humidity (%)", 30, 90, 60)
appliance_usage = st.slider("Appliance Usage (units)", 1, 10, 5)

# Button
if st.button("Predict Energy Consumption"):

    url = f"http://127.0.0.1:8000/predict?temperature={temperature}&humidity={humidity}&appliance_usage={appliance_usage}"
    
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()

        st.success(f"Predicted Energy: {data['predicted_energy_consumption']} units")
        st.info(f"Usage Level: {data['usage_level']}")
    else:
        st.error("Error connecting to backend")