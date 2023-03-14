#!/bin/bash
yao migrate --force
yao run flows.init.menu
yao run flows.demo.reset