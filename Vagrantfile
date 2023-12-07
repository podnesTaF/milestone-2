# -*- mode: ruby -*-
# vi: set ft=ruby :

Vagrant.configure("2") do |config|
  # Specify the base box
  config.vm.box = "bento/ubuntu-22.04"

  # Configure a private network with a specific IP
  config.vm.network "private_network", ip: "192.168.56.5"

  config.vm.network "public_network"

  # Synced folder configuration
  config.vm.synced_folder "./pean-stack", "/home/vagrant/pean-stack"
  config.vm.synced_folder "./milestone-2-app", "/home/vagrant/milestone-2-app"

  # Forward the port used by the PostgreSQL database
  # Assuming the default PostgreSQL port (5432) is used
  config.vm.network "forwarded_port", guest: 5433, host: 5433

  config.vm.network "forwarded_port", guest: 30080, host: 30080

  # Forward Prometheus port
  config.vm.network "forwarded_port", guest: 9090, host: 9090

  # Forward Grafana port
  config.vm.network "forwarded_port", guest: 3000, host: 3000

   # Configure VM provider settings
   config.vm.provider "virtualbox" do |vb|
    # Customize the amount of memory on the VM:
    vb.memory = "4096"  # Set this to the desired memory (in MB)

    # Customize the number of CPUs on the VM:
    vb.cpus = 2  # Set this to the desired number of CPUs
  end


  # Provisioning (Optional, based on your setup)
  # You can use shell scripts or other provisioning tools like Ansible, Puppet, or Chef
  # For example, a simple shell script to update and install necessary packages
  config.vm.provision "shell", path: "script.sh"

end
