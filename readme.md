# 4D_Corner_Component_List

This repository contains the **4D_Corner_Component_List** component.

## Checklist

Before publishing, make sure:

- [ ] A valid icon is included in the component  
- [ ] A clear GitHub description is provided  
- [ ] The `4d-component` topic is added  
- [ ] A license is defined in the repository  
- [ ] A README file explains how to use the component
- [ ] The component is packaged as a ZIP file and added to a GitHub Release  
- [ ] Semantic versioning is used (majorVersion.minorVersion.patchNumber)  

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

The icon file must be named logo.svg or logo.png and must be located either in the Resources folder or in the root directory of the component. To appear in the 4D Corner, icons must be listed in the “Code” section on GitHub.

### GitHub Description

The repository must include a **clear and meaningful description**.

This description should explain what the component does.

### GitHub Topic

The repository must include the following topic: **4d-component**.

This tag is required for proper indexing and allows the community to easily find 4D components.

### License

The repository must include a license.

A license file must be present (e.g. MIT, Apache 2.0, etc.)
The license should be clearly defined in the GitHub repository
This ensures that others understand how the component can be used and shared

### Usage Documentation

The repository must include a README file explaining how to use the component.

Provide clear installation steps
Include basic usage examples
Describe key features and entry points
This helps other developers quickly understand and adopt the component

## GitHub Package Requirements

To enable direct integration of your component from GitHub into 4D projects (via the Component Manager), your repository must contain a properly packaged release.

### Package Structure

1. **Compress your component into ZIP format**
   - Create a ZIP archive containing your component files
   - Name the archive **exactly the same as your repository name**
   - Example: If your repository is named `myComponent`, the ZIP must be named `myComponent.zip`

2. **Integrate the ZIP into a GitHub Release**
   - Create a release in your repository
   - Upload the ZIP file as a release asset
   - Specify a tag and version number for the release

### Versioning

Use **Semantic Versioning** (majorVersion.minorVersion.patchNumber) for your releases:
- Example: `1.2.3`
- You can also use tags: e.g., `v1.0.0`, `stable`, etc.

### Automation

This process can be automated using **4D code or GitHub Actions** to ensure consistent and efficient component distribution.

### Reference

For more details, refer to the [4D Blog: Integrate 4D Components Directly from GitHub](https://blog.4d.com/integrate-4d-components-directly-from-github/)

## Contributing

Please ensure that any contribution respects these guidelines.
