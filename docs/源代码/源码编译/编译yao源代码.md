# Compile `Yao` App From Sources

**Notice**:this is personal version build record. offical version please refer to [Yao Document](https://yaoapps.com/doc/%E4%B8%93%E5%AE%B6/%E6%BA%90%E7%A0%81%E7%BC%96%E8%AF%91).

check the os glibc version,the target machine's glibc version should high then app-build machine.

```sh
ldd --version
ldd (GNU libc) 2.17
```

install go-bindata

```sh
go install -a -v github.com/go-bindata/go-bindata/...@latest
```

`setup go`

need to install the `go 1.20` and `node 16`.

```sh
mkdir -p /root/go

cd /root/go

#backup the older version
mv go go1.8

wget https://go.dev/dl/go1.20.2.linux-amd64.tar.gz

tar -xvf go1.20.2.linux-amd64.tar.gz

```

update the file `.bashrc`,add go path。

```sh
export GOROOT="/root/go/go"
export GOPATH="/root/go/workspace"
export PATH="$PATH:$GOPATH/bin:$GOROOT/bin"
```

setup `node 16`

```sh
nvm install v16.14.2
nvm alias default v16.14.2
nvm use v16.14.2
npm i -g pnpm
```

pull all the source from github. don't change the folder `/data/projects/yao/yao-app-sources`

```sh
mkdir -p /data/projects/yao/yao-app-sources

cd /data/projects/yao/yao-app-sources

git clone https://github.com/wwsheng009/xgen --depth 1 xgen-v1.0

#use custom build script,need to build the xgen first.
cd xgen-v1.0 && pnpm install && pnpm run build

cd /data/projects/yao/yao-app-sources

git clone  https://github.com/wwsheng009/yao --depth 1

git clone  https://github.com/wwsheng009/xun --depth 1

git clone  https://github.com/wwsheng009/kun --depth 1

git clone  https://github.com/wwsheng009/go-hdb --depth 1

git clone  https://github.com/YaoApp/v8go --depth 1

git clone  https://github.com/wwsheng009/gou

# for gou,we need to checkout branch saphana
cd gou && git checkout saphana
```

clone the `clone docs`, which contain the `yao-init`. don't change the folder `/data/projects/yao/demos-v1.0/`

```sh
mkdir -p /data/projects/yao/demos-v1.0/

cd /data/projects/yao/demos-v1.0/

git clone https://github.com/wwsheng009/yao-docs --depth 1
```

build the yao application.

```sh
cd /data/projects/yao/yao-app-sources/yao

cd yao && make debug1

# check version
yao version
```
