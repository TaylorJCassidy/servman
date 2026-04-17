#! /bin/bash

# $1 - dir to tarball
# $2 - name of tarball
# $3 - dir to write tarball to

echo "tar -czvf "$3/$2.tar.gz" $1"
tar -czvf "$3/$2.tar.gz" $1
