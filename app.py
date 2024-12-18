from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import nltk
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords, words
import re

# Download NLTK resources
nltk.download('stopwords')
nltk.download('punkt')
nltk.download('wordnet')
nltk.download('words')

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Allow cross-origin requests for local development

# Load the trained model
model = joblib.load('categorization_model.pkl')

# Define preprocessing functions
wordDict = set(words.words())
stop_words = set(stopwords.words('english'))
lemmatizer = WordNetLemmatizer()

def wordBreak(word):
    n = len(word)
    dp = [False] * (n + 1)
    dp[0] = True  # Base case: empty string can always be segmented

    # To store segmented parts
    prev = [-1] * (n + 1)

    for i in range(1, n + 1):
        for j in range(i):
            if dp[j] and word[j:i] in wordDict:
                dp[i] = True
                prev[i] = j
                break

    # If dp[n] is True, then the word is segmentable
    if dp[n]:
        segments = []
        idx = n
        while idx > 0:
            segments.append(word[prev[idx]:idx])
            idx = prev[idx]
        return segments[::-1]  # Reverse to get the segments in order
    else:
        return [word]  # If not segmentable, return the word as is
    
def clean_text(text):
    # Apply Word Break for Out-Of-Vocabulary words
    words = text.split()
    segmented_words = []
    for word in words:
        word = re.sub(r'[^a-zA-Z]', '', word) # Remove non-alphabetic characters
        if word not in wordDict:  # If the word is not in the dictionary, apply Word Break
            segmented_words.extend(wordBreak(word))
        else:
            segmented_words.append(word)
    text = ' '.join(segmented_words) # Remove extra spaces
    return text

def preprocess_text(text):
    text = text.lower() # Lowercase text
    text = clean_text(text) # Clean text
    tokens = nltk.word_tokenize(text) # Tokenize the text
    tokens = [word for word in tokens if word not in stop_words] # Remove stopwords
    tokens = [lemmatizer.lemmatize(word) for word in tokens] # Lemmatization
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