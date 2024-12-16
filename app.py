from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import nltk
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
import re

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Allow cross-origin requests for local development

# Load the trained model
model = joblib.load('categorization_model.pkl')

# Define preprocessing functions
nltk.download('stopwords')
nltk.download('punkt')
nltk.download('wordnet')
stop_words = set(stopwords.words('english'))
lemmatizer = WordNetLemmatizer()

def clean_text(text):
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def preprocess_text(text):
    text = text.lower()
    text = clean_text(text)
    tokens = nltk.word_tokenize(text)
    tokens = [word for word in tokens if word not in stop_words]
    tokens = [lemmatizer.lemmatize(word) for word in tokens]
    return ' '.join(tokens)

# Route for prediction
@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    if 'feedback' not in data:
        return jsonify({'error': 'Feedback text is required'}), 400

    feedback = data['feedback']
    cleaned_feedback = preprocess_text(feedback)
    category = model.predict([cleaned_feedback])[0]

    # Map category to descriptive text
    category_map = {
        'assessments': 'Assessments',
        'curriculum': 'Curriculum',
        'facilities': 'Facilities',
        'faculty': 'Faculty',
        'support': 'Student Affairs'
    }
    return jsonify({'category': category_map.get(category, 'Unknown')})

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)