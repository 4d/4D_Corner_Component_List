# 4D_Corner_Component_List

This repository contains the **4D_Corner_Component_List** component.

## Checklist

Before publishing, make sure:

- [ ] A valid icon is included in the component  
- [ ] A clear GitHub description is provided  
- [ ] The `4d-component` topic is added  

## Overview

To ensure consistency, usability, and better visibility within the 4D community, please follow the guidelines below.

## JSON Structure

The JSON defines the metadata for a 4D component. It must include the following fields:

### Required Fields

- **`title`**  
  - Type: string  
  - Description: The name of the component  
  - Must not be empty  
  - Example:
    ```json
    "title": "4D QPDF"
    ```

- **`repository`**  
  - Type: string (URL)  
  - Description: The URL of the component's repository (typically on GitHub)  
  - Must be a valid URL  
  - Example:
    ```json
    "repository": "https://github.com/4d/4D-QPDF"
    ```

### Optional Fields

- **`path_logo`**  
  - Type: string (URL)  
  - Description: If the logo is **not in the root or in the Resources folder**, this field can point to the logo file.  
  - Must be a direct URL to the image file 
  - Example:
    ```json
    "path_logo": "https://raw.githubusercontent.com/4d/4D-QPDF/main/4D-QPDF/Resources/logo.svg"
    ```

### Example JSON

**Complete:**
```json
{
  "title": "4D QPDF",
  "repository": "https://github.com/4d/4D-QPDF",
  "path_logo": "https://raw.githubusercontent.com/4d/4D-QPDF/main/4D-QPDF/Resources/logo.svg"
}
```

## Requirements

### Icon

The component must include a **valid icon embedded within the component**.

- The icon should be properly configured
- It must display correctly in the 4D environment
- It helps users quickly identify the component

### GitHub Description

The repository must include a **clear and meaningful description**.

This description should explain what the component does.

### GitHub Topic

The repository must include the following topic: **4d-component**.

This tag is required for proper indexing and allows the community to easily find 4D components.

## Contributing

Please ensure that any contribution respects these guidelines.