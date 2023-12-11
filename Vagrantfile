# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  # Specified the base box
  config.vm.box = "bento/ubuntu-22.04"

  # Configured a private network with a specific IP
  config.vm.network "private_network", ip: "192.168.56.5"

  # Synced folder configuration
  
  # for the docker images
  config.vm.synced_folder "./pean-stack", "/home/vagrant/pean-stack"
  # for the helm management
  config.vm.synced_folder "./milestone-2-app", "/home/vagrant/milestone-2-app"

  # Forward the port used by the PostgreSQL database (My host using 5433 for postgresql)
  config.vm.network "forwarded_port", guest: 5433, host: 5433

  # Forward port for the frontend
  config.vm.network "forwarded_port", guest: 30080, host: 30080

  # Forward Prometheus port
  config.vm.network "forwarded_port", guest: 9090, host: 9090

  # Forward Grafana port
  config.vm.network "forwarded_port", guest: 3000, host: 3000

   # Configure VM provider settings
   config.vm.provider "virtualbox" do |vb|
    vb.memory = "8096"  # Set this to the desired memory (in MB)
    vb.cpus = 3  # Set this to the desired number of CPUs

  end

  config.vm.provision "shell", path: "script.sh"

end
