# Contribute to the "Is this GraphQL?" extension

Hello folks, happy to have you here! This Google Chrome extension is open source, so if you encounter any problems or have ideas on how to improve its functionality: we would love to see your contributions. 
Whether it's raising issues, starting a discussion or contributing lines of code. It all has value.


## Deployment

> **Info**
> Only Stellate employees can publish a new version of the extension. There are some manual steps involved.
>
> External contributors: please file a Pull Request and we will take care of releasing it once it has been merged.
> 
> Stellate employees, check out this [Gain access to "Is this GraphQL?" extension in Chrome Web Store](https://www.notion.so/stellatehq/Gain-access-to-Is-this-GraphQL-extension-in-Chrome-Web-Store-26bb5d55055541918133b86a81f3d8f8?pvs=4) document.

* Checkout the repository
* Create new branch
  * `git checkout -b v1.5.0`
* Bump the version to a new semver version of the upcoming release. This involves two steps
  1. Bump `dist/manifest.json` version and commmit manually
  2. `npm version <patch|minor|major>` (commits & tags automatically)
* ⚠️ Use Node 16 (it's EOL, we know, sorry!)
* Build the ZIP bundle of the new release
  1. `npm run build`
  2. `cd dist`
  3. `zip -r ../is-this-graphql-extension.zip *`
  4. `open ..` (to show you the folder where the ZIP file is located)
* Navigate to the "Is this GraphQL" extension in the Chrome Developer Dashboard
* Select "Package" on the left menu
* Top right "Upload new package" and select the newly created ZIP file from before
* "Save draft"
* Check in "Package" that the draft shows the new version number
* Go to "Distribution" and hit "Submit for review"
* Open up PR on the GitHub repo with the version bumps
