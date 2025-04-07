from joblib import load

def working_model(data):
    model = load('random_forest_ddos.pkl') 
    prediction = model.predict(data)
    return prediction