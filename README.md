# Playing Card Maker

## Overview
The Playing Card Maker is a web application that allows users to create and customize playing cards. Users can set background images for each card, manage card data, and export their creations. The application features a dark theme and is built using Bootstrap for styling and jQuery for interactivity.

## Features
- **Top Bar Dropdown Menu**: Access file operations such as Create New, Load, Save, Save As, and Export.
- **Card Display**: View and interact with 52 empty playing cards arranged in a grid format.
- **Image Backgrounds**: Click on a card to set a custom background image from a URL.
- **Unique ID Generation**: Each card is assigned a unique ID for easy management.
- **Data Management**: Save and load card configurations using JSON format.

## Project Structure
```
playing-card-maker
├── src
│   ├── index.html          # Main HTML document
│   ├── css
│   │   ├── bootstrap-dark.min.css  # Minified Bootstrap CSS with dark theme
│   │   └── style.css       # Custom styles for the application
│   ├── js
│   │   ├── jquery.min.js   # Minified jQuery library
│   │   ├── bootstrap.bundle.min.js  # Minified Bootstrap JavaScript components
│   │   └── app.js          # Main JavaScript logic for the application
│   ├── assets
│   │   └── symbols.js      # Data for card symbols and numbers
│   └── data
│       └── cards.json      # JSON file for storing card data
├── package.json             # npm configuration file
└── README.md                # Project documentation
```

## Installation
1. Clone the repository:
   ```
   git clone <repository-url>
   ```
2. Navigate to the project directory:
   ```
   cd playing-card-maker
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage
1. Open `src/index.html` in a web browser.
2. Use the dropdown menu to create new cards, load existing configurations, or save your work.
3. Click on any card to set a background image by entering a URL.
4. Export your card designs as needed.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License. See the LICENSE file for details.