# SHIPPING CHALLENGE MILESTONE 2

### Author: Oleksii Pidnebesnyi | r0934777

### Stack Used

- NodeJs
- PostgreSql
- Apache
- Docker
- Vagrant
- Kubernetes
- Heml
- Minikube
- Prometeus / Grafana
- ArgoCD

### Table of Contents

- [Vagrant VM Configuration](#vagrant-vm-configuration)
- [Docker images: Frontend, Backend, Database](#docker-images-frontend-backend-database)
- [Minikube Cluster Configuration](#creating-kubernetes-cluster)
- [Kubernetes with Helm](#kubernetes-with-helm)
- [Monitoring the Cluster with Prometheus](#monitoring-the-cluster-with-prometheus)
- [Setting Up Argo CD](#setting-up-argo-cd)
- [CI/CD with GitHub Actions](#cicd-with-github-actions)
- [Tests](#tests)
- [Conclusion](#conclusion-3)

## Vagrant VM Configuration

### Overview

This section outlines the configuration for setting up a VM using Vagrant, tailored for a web services development environment.

### Configuration

- Base Box Selection

```ruby
  config.vm.box = "bento/ubuntu-22.04
```

- Network Configuration

```ruby
  config.vm.network "private_network", ip: "192.168.56.5"
```

- Port Forwarding

```ruby
  # Forward the port used by the PostgreSQL database (My host using 5433 for postgresql)
  config.vm.network "forwarded_port", guest: 5433, host: 5433

  # Forward port for the frontend
  config.vm.network "forwarded_port", guest: 30080, host: 30080

  # Forward Prometheus port
  config.vm.network "forwarded_port", guest: 9090, host: 9090

  # Forward Grafana port
  config.vm.network "forwarded_port", guest: 3000, host: 3000
```

- Synced Folders

```ruby
  # for the docker images
  config.vm.synced_folder "./pean-stack", "/home/vagrant/pean-stack"
  # for the helm management
  config.vm.synced_folder "./milestone-2-app", "/home/vagrant/milestone-2-app"
```

- Provisioning with a Shell Script

```ruby
   config.vm.provision "shell", path: "script.sh"
```

Executes script.sh for installing PostgreSQL, Docker, Kubernetes, Minikube, Helm, Prometheus, Grafana, and Argo CD.

## Docker images: Frontend, Backend, Database

### Introduction

This section of the documentation details the creation and configuration of Docker images for the frontend, backend, and database components. The frontend uses Apache with HTML, the backend is built with Node.js, and PostgreSQL serves as the database.

### Backend Configuration

- Located under pean-stack/backend.

#### Key files:

- index.js: Contains the server logic.
- Dockerfile: Instructions for building the Docker image.
- package.json: Lists Node.js dependencies.

First of all install necessary packages:

```
  npm i cors express pg
```

- pg - to work with PostgreSql
- cors - to handle the cors middleware
- express - a framework for nodejs

#### backend code:

- Initializes Express and other dependencies like cors and pg
- Sets up a connection pool to PostgreSQL.
- Defines a GET route to fetch user data.
- Starts the server and initializes the database.

```js
// Import necessary modules
const express = require("express"); // Express framework for handling server requests
const cors = require("cors"); // CORS middleware to enable cross-origin requests
const os = require("os"); // OS module to access operating system related utilities
const { Pool } = require("pg"); // PostgreSQL client pool from the pg module

// Initialize express application
const app = express();
app.use(cors()); // Apply CORS middleware

// Configuration for server and PostgreSQL
const PORT = 4000; // Server port
const hostname = "0.0.0.0"; // Hostname (0.0.0.0 listens on all interfaces)
const MAX_RETRIES = 10; // Maximum number of retries to connect to the database
const RETRY_DELAY = 5000; // Delay in milliseconds between retries

const pool = new Pool({
  // PostgreSQL connection pool configuration
  user: "root",
  host: "db",
  database: "pean-db",
  password: "podnes1972",
  port: 5432,
});

// Function to initialize the database
const initializeDb = async () => {
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      // Create a 'users' table if it does not exist
      await pool.query(
        "CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, fullName TEXT NOT NULL)"
      );

      // Insert initial data if the table is empty
      const res = await pool.query("SELECT COUNT(*) FROM users");
      if (parseInt(res.rows[0].count) === 0) {
        await pool.query(
          "INSERT INTO users (fullName) VALUES ('Oleksii Pidnebesnyi')"
        );
      }

      break; // If no errors, exit the loop
    } catch (error) {
      console.error("Error initializing database:", error);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
    }
  }
};

// Define a GET route
app.get("/", async (req, res) => {
  try {
    // Fetch the first user's full name from the database
    const result = await pool.query("SELECT fullName FROM users LIMIT 1");
    const user = result.rows[0].fullname;

    // Respond with user data and container ID
    res.json({ user, containerId: os.hostname() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Function to start the server
const startServer = async () => {
  try {
    await initializeDb(); // Initialize the database
    app.listen(PORT, hostname, () => {
      // Start the server
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
  }
};

startServer(); // Invoke the server start function
```

#### Dockerfile

```docker
 # Start with Node.js version 16 as the base image
  FROM node:16

  # Set the working directory inside the container
  WORKDIR /usr/src/app

  # Copy package.json and package-lock.json (if available) to the container
  COPY package*.json ./

  # Install project dependencies inside the container
  RUN npm install

  # Copy all project files into the container
  COPY . .

  # Expose port 4000 to be accessible from outside the container
  EXPOSE 4000

  # Define the command to run the application
  CMD ["node", "index.js"]
```

### Frontend Configuration

The Docker configuration for the frontend involves setting up an Apache server to host a simple HTML page. This process is encapsulated in a Dockerfile, ensuring a consistent and reproducible environment for deployment.

- Located under pean-stack/frontend.

#### Key files:

- index.html: Contains the simple html page with js script.
- Dockerfile: Instructions for building the Docker image.

#### index.html

As a template I took this [html file](https://gist.github.com/meyskens/cee4c082802c2cd9e4d3bfce8085b36c)

I slightly changed the scripts to handle error and add container id. Additionaly I specified the host and port my backend use.

```html
<script>
  // fetch user from API
  try {
    fetch("http://192.168.56.5:4000")
      .then((res) => res.json())
      .then((data) => {
        // get user name
        const { user, containerId } = data;
        // display user name
        document.getElementById("user").innerText = user;

        // display container id
        document.getElementById("containerId").innerText = containerId;
      })
      .catch((error) => {
        document.getElementById("user").innerText = error;
      });
  } catch (error) {
    document.getElementById("user").innerText = "Error";
    console.log(error);
  }
</script>
```

#### Docker configuration

the docker will use ubuntu:22.04 for a stable Linux environment and apache as a web server.

```docker
  # Start with Ubuntu 22.04 as the base image
  FROM ubuntu:22.04

  # Set environment variable to avoid interactive prompts during installation
  ARG DEBIAN_FRONTEND=noninteractive

  # Update package list and install Apache2
  RUN apt-get update && apt-get install -y apache2

  # Copy the main HTML file to the Apache server's root directory
  COPY ./index.html /var/www/html/index.html

  # Expose port 80, the default port for HTTP traffic
  EXPOSE 80

  # Start Apache2 in the foreground
  CMD ["apachectl", "-D", "FOREGROUND"]
```

### Database Configuration

I will configure database in chapter [Kubernetes with helm](#kubernetes-with-helm)

### Build and push to docker hub

In order to easily use the images with kubernetes and helm, I built and deployed the images to docker hub.

```shell
  docker login

  docker build -t podnes/backend-op ./backend
  docker build -t podnes/frontend-op ./frontend

  docker push podnes/backend-op:latest
  docker push podnes/frontend-op:latest
```

Using docker ps and docker images commands I can verify that images were created successfully

## Creating Kubernetes cluster

To create and manage kubernetes cluster I used minikube.

The package was installed while vagrant provisioning. To verify:

```
minikube -v
```

Firsly, I generated a cluster with two nodes by running:

```
minikube start --nodes 2 -p multinode-op
```

it created two nodes and provide me ip address for cubernetes:

```
  kubectl get nodes

  NAME               STATUS   ROLES           AGE   VERSION
  multinode-op       Ready    control-plane   22h   v1.28.3
  multinode-op-m02   Ready    <none>          26s   v1.28.3

  minikube ip -p multinode-op

  192.168.67.2
```

I can now use the kubernetes cluster.

## Kubernetes with Helm

This section documents the Helm chart "milestone-2-app", focusing on the configuration of Kubernetes resources like pods, services, and persistent volume claims (PVCs) for the backend, frontend, and database components.

### Creating a new helm chart:

To start with help I first verified that my vagrant provisioned the installation of helm:

```bash
  helm -v
```

after verifying I run scripts to create chart "milestone-2-app"

```
  helm create milestone-2-app
```

The command generated me a "milestone-2-app" with:
milestone-2-app
-- values.yaml
-- Chart.yaml
-- templates

### Define values for kubernetes:

Work within values.yaml. The helm automaticaly generated me some setup.

#### Backend configuration

in values.yaml I added backend at the root layer:

```yaml
backend:
  name: backend-op # define a service name
  replicaCount: 3 # Create three replicas for the load balancing
  image:
    repository: podnes/backend-op # the docker hub image refference
    pullPolicy: Always
    tag: "latest"
  service:
    type: ClusterIP
    port: 4000
    targetPort: 4000
```

Now, In my templates files I can access it by running {{.Values.backend...}}

In the templates, I created service and deployment for the backend.

- deployment
  defines how the backend container should be deployed, including the image to be used, the number of replicas, and the ports configuration. It dynamically pulls values from the values.yaml file to make the deployment flexible and configurable.

```yaml
apiVersion: apps/v1 # Specifies the API version for deployment
kind: Deployment # Defines this as a deployment
metadata:
  name: { { .Values.backend.name } } # Sets the deployment name from values.yaml

spec:
  replicas: { { .Values.backend.replicaCount } } # Number of replicas for the deployment
  selector:
    matchLabels:
      app: { { .Values.backend.name } } # Selector to match labels for deployment

  template:
    metadata:
      labels:
        app: { { .Values.backend.name } } # Labels for pod templates

    spec:
      containers:
        - name: backend-op # Container name
          image: "{{ .Values.backend.image.repository }}:{{ .Values.backend.image.tag }}" # Image to use for container
          ports:
            - containerPort: { { .Values.backend.service.port } } # Container port to expose
```

- The file sets up a Kubernetes service for the backend application

```yaml
apiVersion: v1
kind: Service # Specifies this as a Service resource
metadata:
  name: { { .Values.backend.name } } # Service name, derived from values.yaml

spec:
  type: { { .Values.backend.service.type } } # Type of service (e.g., ClusterIP, NodePort)
  ports:
    - port: { { .Values.backend.service.port } } # The port the service operates on
      targetPort: { { .Values.backend.service.targetPort } } # The port of the backend container
  selector:
    app: { { .Values.backend.name } } # Selector to link service to backend pods
```

### Frontend Configuration

In values.yaml, the frontend configuration is defined as follows:

```yaml
frontend:
  name: frontend-op # Service name for the frontend
  replicaCount: 1 # Number of replicas, usually one for a frontend
  image:
    repository: podnes/frontend-op # Docker image for the frontend
    pullPolicy: Always
    tag: "latest"
  service:
    type: NodePort # Exposes the service on each node's IP
    port: 80 # Standard HTTP port
    nodePort: 30080 # External port to access the service
    targetPort: 80 # Target port on the container
```

This configuration sets up the frontend service and deployment details in the Helm chart.

- frontend-deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment # Defines this as a Deployment resource
metadata:
  name: { { .Values.frontend.name } } # Sets deployment name from values.yaml

spec:
  replicas: { { .Values.frontend.replicaCount } } # Number of replicas
  selector:
    matchLabels:
      app: { { include "milestone-2-app.fullname" . } } # Selector to match labels
  template:
    metadata:
      labels:
        app: { { include "milestone-2-app.fullname" . } } # Labels for pod templates
    spec:
      containers:
        - name: frontend-op # Container name
          image: "{{ .Values.frontend.image.repository }}:{{ .Values.frontend.image.tag }}" # Image to use
          imagePullPolicy: { { .Values.frontend.image.pullPolicy } }
          ports:
            - containerPort: { { .Values.frontend.service.port } } # Expose container port
```

This deployment script pulls the frontend image and creates the specified number of replicas, setting the appropriate labels and container port.

- frontend-service.yaml

```yaml
apiVersion: v1
kind: Service # Defines this as a Service resource
metadata:
  name: { { .Values.frontend.name } } # Service name from values.yaml

spec:
  type: { { .Values.frontend.service.type } } # Service type (NodePort, ClusterIP, etc.)
  ports:
    - port: { { .Values.frontend.service.port } } # The service operates on this port
      nodePort: { { .Values.frontend.service.nodePort } } # External port for NodePort service
      targetPort: { { .Values.frontend.service.targetPort } } # Port on the container
  selector:
    app: { { .Values.frontend.name } } # Selector to link service to frontend pods
```

This service configuration exposes the frontend application on a specific node port, allowing access to it from outside the Kubernetes cluster.

### Database Configuration

In the values.yaml file, the database configuration is defined as follows:

```yaml
database:
  name: db # Name for the database service and deployment
  image:
    repository: postgres # PostgreSQL image
    pullPolicy: IfNotPresent
    tag: "latest"
  service:
    type: ClusterIP # Internal cluster service type
    port: 5432 # PostgreSQL default port
    targetPort: 5432
  storage:
    size: 1Gi # Storage size for the database
    storageClass: standard
```

- db-deployment.yaml:

```yaml
apiVersion: apps/v1 # API version for deployment
kind: Deployment # Defines this as a Deployment resource
metadata:
  name: { { .Values.database.name } } # Deployment name from values.yaml
  labels:
    app: { { .Values.database.name } } # Labels for identifying the deployment

spec:
  replicas: 1 # Single instance of database for consistency
  selector:
    matchLabels:
      app: { { .Values.database.name } } # Label selector for the pod
  template:
    metadata:
      labels:
        app: { { .Values.database.name } } # Labels for the pod template
    spec:
      containers:
        - name: db # Container name
          image: "{{ .Values.database.image.repository }}:{{ .Values.database.image.tag }}" # Database image
          imagePullPolicy: { { .Values.database.image.pullPolicy } } # Image pull policy
          ports:
            - containerPort: { { .Values.database.service.port } } # Exposed container port
          env:
            - name: POSTGRES_DB
              valueFrom:
                secretKeyRef:
                  name: pgdatabase
                  key: POSTGRES_DB
            - name: POSTGRES_PASSWORD
              valueFrom:
                secretKeyRef:
                  name: pgpassword
                  key: POSTGRES_PASSWORD
            - name: POSTGRES_USER
              valueFrom:
                secretKeyRef:
                  name: pguser
                  key: POSTGRES_USER
```

This deployment script sets up the PostgreSQL database, ensuring a single instance with the appropriate configurations and linking environment variables to Kubernetes secrets.

- db-service.yaml:

```yaml
apiVersion: v1
kind: Service
metadata:
  name: { { .Values.database.name } }
spec:
  type: { { .Values.database.service.type } }
  ports:
    - port: { { .Values.database.service.port } }
      targetPort: { { .Values.database.service.targetPort } }
  selector:
    app: { { .Values.database.name } }
```

- db-pvc.yaml:

```yaml
apiVersion: v1 # API version for PersistentVolumeClaim resource
kind: PersistentVolumeClaim # Defines this as a PersistentVolumeClaim resource
metadata:
  name: { { .Values.database.name } } # PVC name from values.yaml

spec:
  accessModes:
    - ReadWriteOnce # Access mode - ReadWriteOnce allows single node read-write
  resources:
    requests:
      storage: { { .Values.database.storage.size } } # Storage size request
```

### Conclusion

In this section, I detailed the creation and configuration of a Helm chart named "milestone-2-app" for Kubernetes resource management. This included setting up and customizing values.yaml for backend, frontend, and database components, along with creating corresponding deployment, service, and PVC templates. The process streamlined the deployment and ensured efficient management of the application's Kubernetes resources.

### Test the Helm app

To test the chart for linting mistakes helm has a command:

```
helm lint

1 chart(s) linted, 0 chart(s) failed
```

After fixing possible mistakes I can run a preview:

```
  helm template release .
```

I chose name "release" for the chart release name

#### Install helm app

After finalizing the Helm chart configurations, the application can be deployed to a Kubernetes cluster using the command:

```
helm install [RELEASE_NAME] [CHART]


Release "release" has been upgraded. Happy Helming!
NAME: release
LAST DEPLOYED: Fri Dec  8 13:26:29 2023
NAMESPACE: default
STATUS: deployed
REVISION: 4
```

where [RELEASE_NAME] is a user-defined name for the deployment and [CHART] is the path or name of the Helm chart.

I can see some logs confirming the deployment.

Helm generated me pods and services:

```
  kubectl get pods

  backend-op-554d56bd8d-kq7l9                          1/1     Running   2 (8m16s ago)   21h
  backend-op-554d56bd8d-l5q8b                          1/1     Running   3 (8m16s ago)   22h
  backend-op-554d56bd8d-wpc5f                          1/1     Running   2 (8m16s ago)   21h
  db-78b4fbc595-cbfnh                                  1/1     Running   2 (8m16s ago)   21h
  frontend-op-7758bc6b48-fz6tn                         1/1     Running   2 (8m16s ago)   21h

  kubectl get services:

  backend-op                            ClusterIP   10.111.212.208   <none>        4000/TCP            22h
  db                                    ClusterIP   10.103.186.10    <none>        5432/TCP            22h
  frontend-op                           NodePort    10.99.152.112    <none>        80:30080/TCP        22h
```

#### Testing webpage:

To run the website on the host machine I have to forward ports for my backend and frontend app.

I wrote and configured port-forwarding.sh file to forward every port within one terminal session:

```sh
  #!/bin/bash

  # Forward ports for backend services
  kubectl port-forward pod/[frontend-pod-name] --address 192.168.56.5 30080:80 &
  kubectl port-forward svc/backend-op --address 192.168.56.5 4000:4000 &

  # Wait for any process to exit
  wait
```

so now I can open the website in browser within my host machine on url 192.168.56.5:30080:

![Sample](https://storage.googleapis.com/abe_cloud_storage/image/large/850f0bf9-78a3-4b44-9494-1fa519bec1da.png)

## Monitoring the Cluster with Prometheus

In this chapter, I tackle the key assignment of monitoring cluster resources and performance using Prometheus. This involves setting up Prometheus to collect metrics from the Kubernetes cluster, providing a comprehensive view of the cluster's health and performance. I will delve into configuring Prometheus for optimal data collection and integrating it with Grafana for visualizing these metrics. This enables us to effectively monitor various aspects of the cluster, including node and pod performance, resource usage, and system health.

### Instalation

I have already install Prometeus and Grafana in provision scripts:

```sh
# Install Prometheus and Grafana
helm repo add grafana https://grafana.github.io/helm-charts
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/prometheus
# Install Grafana
helm install grafana grafana/grafana
```

To make sure I get the authorization guide I run:

```
  # for prometeus
  helm upgrade prometheus prometheus-community/prometheus

  # for grafana
  helm upgrade grafana grafana/grafana
```

in the output I get the authorization guide and ports to access the app.

Add those ports to port-forward.sh script:

```sh
+ kubectl port-forward deploy/grafana --address 192.168.56.5 3000:3000 &
+ kubectl port-forward deploy/prometheus-server --address 192.168.56.5 9090:9090 &
```

I logged in as default "admin" user.
and see the dashboards:

![grafana](https://storage.googleapis.com/abe_cloud_storage/image/large/55f32432-faad-4bad-afd5-1ca83e1858e9.png)
![prometeus](https://storage.googleapis.com/abe_cloud_storage/image/large/f3297c53-3299-4371-ab41-4d99d8f19700.png)

### Grafana configuration

In Grafana's settings, I added Prometheus as a data source by specifying the Prometheus service URL. (192.168.56.5:9090).

#### Grafana dashboard

I found interesting dashboard in [grafana website](https://grafana.com/grafana/dashboards/).

The dashboard called [Kubernetes Cluster Autoscaler (via Prometheus)](https://grafana.com/grafana/dashboards/3831-autoscaler/). It's free and I can easily import it to my project by navigating to dashboards in grafana local app and improrting new dashboard by id.

Accessing the dashboard I realized, that predefined queries are really fetch the data from my prometeus, so I decided to write my own custom queries.

Fow example:

- count running nodes

```
  count(kube_node_info)
```

- Count running pods

```
  count(kube_pod_status_phase{phase="Running"})
```

- CPU'S usage per node:

```
  sum(rate(node_cpu_seconds_total{mode!="idle"}[5m])) by (instance)
```

- CPU's usage per pode:

```
sum(rate(container_cpu_usage_seconds_total[5m])) by (pod)
```

- Network I/O Pressure:

```
sum(rate(container_network_receive_bytes_total[5m])) by (pod)

sum(rate(container_network_transmit_bytes_total[5m])) by (pod)
```

The result:

![grafana charts](https://storage.googleapis.com/abe_cloud_storage/image/large/ee4fa13d-1d5c-43b3-8bcb-0d3e74804690.png)

### Conclusion

In this chapter, I successfully set up Prometheus and Grafana for monitoring my Kubernetes cluster, ensuring efficient tracking of resources and performance. After installing both tools using Helm, I configured port forwarding to access their interfaces. I integrated Prometheus as a data source in Grafana and explored various custom and pre-built dashboards, including one from Grafana's website for Kubernetes Cluster Autoscaler. Custom queries were written to monitor metrics like node count, pod status, CPU usage, and network I/O, providing a comprehensive view of the cluster's health and performance.

## Setting Up Argo CD

### Introduction

This chapter details the setup of Argo CD, a declarative, GitOps continuous delivery tool for Kubernetes. By leveraging Argo CD, I can automate the deployment process and maintain a consistent state of applications as defined in the Git repository.

### Installation Process

Installation via Helm:

In my provision scripts I included the instalation of argo CD:

```
# Add the Argo CD Helm Repository
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
helm install argocd argo/argo-cd
```

However, to get access to the page I have to generate credentials based on the algorithm retrieved through a specified command.

So I ran

```
  helm upgrade argocd argo/argo-cd
```

It also asked me to forward the port 8080:443
so I added them to the port-forwarding.yaml

```sh
+ kubectl port-forward service/argocd-server --address 192.168.56.5 8080:443 &
```

I can now access the argo cd on my host machine.

### GitHub Repository Setup

To work with agro CD I had to create a repository in some of git cloud services. I decided to use github as it's my favorite one.

I organized project folders: milestone-2-app, pean-stack, and Vagrantfile.

and pushed the to the newly created repo "milestone-2"

### Argo CD and GitHub Integration

I accessed the argo cd dashboard and clicked on settings -> repositories -> add repo. I passed the "milestone-2" and git token as password (generated in github)

After getting success in connection status, I created a agroCD app based on the repo.

I have noticed that I didn't add namespaces to each service and deployment of my helm chart, but argo cd asks that namespaces are defined for each resorce.

```yaml
metadata:
  name: { { .Values.frontend.name } }
+ namespace: default
```

Push changes to github and see the status in argoCD.
I accessed the dashboard:
![agrocd](https://storage.googleapis.com/abe_cloud_storage/image/large/a4515f65-a04b-4b1e-b194-cd5665254578.png)

By setting up Argo CD with a Helm chart on the Kubernetes cluster and configuring it for GitOps workflow, I've automated the deployment of my app. The healthy state of the app in Argo CD indicates that it is being properly managed and deployed according to the configurations in the Git repository.

## CI/CD with GitHub Actions

This section details setting up a Continuous Integration and Continuous Deployment pipeline using GitHub Actions. The pipeline is configured to build and push Docker images to Docker Hub when changes are made to the main branch of the GitHub repository.

I created new folder ".github/workflows" in the root of my project. In the file "ci-cd.yml" I created "jobs" and triggers:

```yaml
on:
  push:
    branches:
      - main
jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - name: Check Out Repo
        uses: actions/checkout@v2

      - name: Log in to Docker Hub
        uses: docker/login-action@v1
        with: # the secret I created inside my working repository. I generated the access  token in the docker hub.
          username: ${{ secrets.DOCKER_HUB_USERNAME }}
          password: ${{ secrets.DOCKER_HUB_ACCESS_TOKEN }}

      - name: Determine Changed Paths
        id: changed-files
        uses: dorny/paths-filter@v2
        with:
          filters: |
            backend:
              - 'pean-stack/backend/**'
            frontend:
              - 'pean-stack/frontend/**'

      - name: Build and Push Backend Docker Image
        if: steps.changed-files.outputs.backend == 'true' # if some files were changed within "backend directory"
        run: |
          docker build -t podnes/backend-op ./pean-stack/backend
          docker push podnes/backend-op:latest

      - name: Build and Push Frontend Docker Image
        if: steps.changed-files.outputs.frontend == 'true' # if some files were changed within "frontend directory"
        run: |
          docker build -t podnes/frontend-op ./pean-stack/frontend
          docker push podnes/frontend-op:latest
```

#### I pushed changes and navigated to the actions tab of repository:

![actions](https://storage.googleapis.com/abe_cloud_storage/image/large/f06366bb-74dd-4e89-8f6b-f6cbac0f5db2.png)

The build and push commands were skipped since I didn't change the files

#### Conclusion

This CI/CD setup automates the building and deploying process of Docker images, ensuring that any updates in the code are seamlessly reflected in the Docker images on Docker Hub and subsequently in the deployed applications.

## Tests

#### The name in the webpage updates after change it in the database.

I decided to add additional endpoint to my backend "/update-name" to prove that name is updating after page reloads:

index.js of backend directory:

```js
// Define a GET route to update name based on query parameter
app.get("/update-name", async (req, res) => {
  try {
    // Get name from query string or default to 'Alex Pidnebesnyi'
    const newName = req.query.name || "Alex Pidnebesnyi";

    // Update the first user's full name in the database
    await pool.query("UPDATE users SET fullName = $1 WHERE id = 1", [newName]);

    // Respond with a success message
    res.json({ message: "Name updated successfully", newName });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
```

Since I configured ci/cd to push images. I can just push the updated file.

```
git add .
git commit -m 'adding endpoint to update the name'
git push
```

This time the backend was triggered, and image pushed to the dockerhub
![built backend](https://storage.googleapis.com/abe_cloud_storage/image/large/dd6a9017-2771-4202-aea3-b131db52cfae.png)

restart the deployment of the backend:

```
kubectl rollout restart deployment/backend-op
```

To update the name, I sipmly navigate to
192.168.56.5:4000/update-name
![update name](https://storage.googleapis.com/abe_cloud_storage/image/large/937f33bd-c252-4ed9-8f94-a132f59e3b15.png)
then go to 192.168.56.5:30080:
![updated name](https://storage.googleapis.com/abe_cloud_storage/image/large/273c0af5-867d-488d-a533-a91c6582a021.png)

## Conclusion

The project adeptly executed a GitOps workflow, integrating Argo CD and GitHub Actions within a Kubernetes framework. Essential monitoring tools, Prometheus and Grafana, were embedded for insightful resource and health tracking. The CI/CD pipeline, crafted with GitHub Actions, streamlined the Docker images' lifecycle, embodying efficient DevOps methodologies. This setup exemplified effective management and deployment strategies, ensuring scalability and reliability in containerized application development.
