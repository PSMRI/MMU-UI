# AMRIT - Mobile Medical Unit (MMU) Service

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0) ![branch parameter](https://github.com/PSMRI/MMU-UI/actions/workflows/sast.yml/badge.svg)

The AMRIT Mobile Medical Unit (MMU) service provides essential medical assistance to individuals without requiring them to be admitted to a hospital. This service operates through a mobile unit equipped with a laboratory for conducting medical tests and the capability to dispense medicines. The MMU employs an internet-connected device to collect and transmit medical data to the AMRIT application. It supports various medical standards and incorporates a feature that allows data capture and synchronization even when an internet connection is unavailable.

## Features

* **MMU - Mobile Medical Unit**: The MMU is a specialized vehicle or facility that delivers medical advice and services to individuals. It serves as a mobile clinic, capable of reaching diverse locations to provide medical support.

* **Outpatient Service**: The MMU offers medical care to individuals who visit the unit but do not require overnight hospitalization. It caters to those who need medical attention but can be treated without being admitted to a hospital.

* **Drug Dispensing**: The MMU can provide prescribed medications to patients. If a doctor prescribes medication, the MMU has the capability to dispense it to the patients.

* **Laboratory Facility**: The MMU is equipped with a laboratory where various medical tests can be conducted. These tests aid in diagnosing diseases or monitoring the health of patients.

* **IoT Device**: The MMU utilizes a specialized internet-connected device to collect data from different medical tests. This device supports around 20 lab tests, and the collected data is directly transmitted to the AMRIT application.

* **AMRIT Application**: The AMRIT application receives and manages the data obtained from lab tests conducted by the MMU. It serves as a central repository for storing and organizing patients' medical information.

* **SnomedCT, LOINC, ICD - 10, FHIR Compatible**: The MMU is compatible with various medical standards and systems used for classifying and organizing medical information. It can understand and utilize medical codes and terms employed in systems such as SnomedCT, LOINC, ICD - 10, and FHIR.

* **Offline Data Capture and Sync Feature**: The MMU includes a feature that enables the collection of medical information even when an internet connection is unavailable. This offline data capture is later synchronized and transferred to the AMRIT application when an internet connection becomes available.

## Building From Source

This microservice is developed using Java and the Spring Boot framework, with MySQL as the database.

### Prerequisites

Ensure that the following prerequisites are met before building the MMU service:

* JDK 17
* Maven 
* Nodejs v18.10.0
* MySQL

### Installation

To install the MMU module, please follow these steps:

1. Clone the repository to your local machine.
2. Install the dependencies and build the module:
   - Run the command `npm install`.
   - Run the command `npm run build`.
   - Run the command `mvn clean install`.
   - Run the command `npm start`.
3. Open your browser and access `http://localhost:4200/#/login` to view the login page of module.

### Building from source

1. To build deployable war files
```bash
mvn -B package --file pom.xml -P <profile_name>
```

The available profiles include dev, local, test, and ci.
Refer to `src/environments/environment.ci.template` file and ensure that the right environment variables are set for the build.

Packing with `ci` profile calls `build-ci` script in `package.json`.
It creates a `environment.ci.ts` file with all environment variables used in the generated build.

## Usage

All the features of the MMU service are exposed as REST endpoints. Please refer to the Swagger API specification for detailed information on how to utilize each feature.

The MMU module offers comprehensive management capabilities for your application.

### Initializing Submodule `Common-UI`

To initialize the `Common-UI` submodule, follow these steps:

1. Clone the `mmu-ui` project:
   ```bash
   git clone https://github.com/PSMRI/MMU-UI

2. Navigate to the project directory and pull the latest changes from the develop branch
   cd mmu-ui
   git checkout develop
   git pull origin develop

3. Open the integrated terminal for the common-ui submodule and initialize it

   cd Common-UI
   git init
   git remote add origin https://github.com/PSMRI/Common-UI
   git submodule update --init --recursive

4. Check the available branches and switch to the develop branch

   git branch
   git checkout develop
   git pull origin develop

## Filing Issues

If you encounter any issues, bugs, or have feature requests, please file them in the [main AMRIT repository](https://github.com/PSMRI/AMRIT/issues). Centralizing all feedback helps us streamline improvements and address concerns efficiently.  

## Join Our Community

We’d love to have you join our community discussions and get real-time support!  
Join our [Discord server](https://discord.gg/FVQWsf5ENS) to connect with contributors, ask questions, and stay updated.  

## Documentation

[DeepWiki - MMU-UI](https://deepwiki.com/PSMRI/MMU-UI)
