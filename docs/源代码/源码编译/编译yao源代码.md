# Compile `Yao` App From Sources

## system setup

don't mount the windows driver in the wsl2 system. the driver performance is very slow.

**Notice**:this is personal version build record. offical version please refer to [Yao Document](https://yaoapps.com/doc/%E4%B8%93%E5%AE%B6/%E6%BA%90%E7%A0%81%E7%BC%96%E8%AF%91).

check the os glibc version,the target machine's glibc version should high then app-build machine.

```sh
ldd --version
ldd (GNU libc) 2.17
```

## ubuntu install dev tools

```sh
sudo apt install gcc g++ make -y
```

## install go

need to install the `go 1.20` and `node 16`.

```sh
mkdir -p /root/go

cd /root/go

wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz

tar -xvf go1.21.6.linux-amd64.tar.gz
```

update the file `.bashrc`,add go path。

```sh
vi ~/.bashrc

export GOROOT="/root/go/go"
export GOPATH="/root/go/workspace"
export PATH="$PATH:$GOPATH/bin:$GOROOT/bin"
```

## install go-bindata

```sh
go install -a -v github.com/go-bindata/go-bindata/...@latest
```

## install `node 16`

```sh
nvm install v16.14.2
nvm alias default v16.14.2
nvm use v16.14.2
npm i -g pnpm
```

## clone yao sources

pull all the source from github. don't change the folder `/data/projects/yao/yao-app-sources`

```sh
mkdir -p yao-app-sources

cd yao-app-sources

git clone https://github.com/wwsheng009/xgen --depth 1 xgen-v1.0

git clone  https://github.com/wwsheng009/yao --depth 1

git clone  https://github.com/wwsheng009/xun --depth 1

git clone  https://github.com/wwsheng009/kun --depth 1

git clone  https://github.com/wwsheng009/go-hdb --depth 1

git clone  https://github.com/wwsheng009/v8go --depth 1

git clone  https://github.com/wwsheng009/yao-init --depth 1

git clone  https://github.com/wwsheng009/gou --depth 1

```

## build the xgen

```sh
cd yao

export NODE_ENV=production

echo "BASE=__yao_admin_root" > ../xgen-v1.0/packages/xgen/.env

cd ../xgen-v1.0 && pnpm install --no-frozen-lockfile && pnpm run build

echo "BASE=yao" > ../xgen-v1.0/packages/xgen/.env

```

## git lfs

if error orrurs when building the v8go

message:

```sh
/v8go/deps/linux_x86_64/libv8.a: file format not recognized; treating as linker script
/v8go/deps/linux_x86_64/libv8.a:1: syntax error

```

for ubuntu,need to install the git-lfs

```sh
cd v8go

sudo apt-get install git-lfs

git lfs fetch

git checkout .
```

## yao builder

```sh
cd yao

mkdir -p ../yao-builder

curl -o ../yao-builder-latest.tar.gz https://release-sv.yaoapps.com/archives/yao-builder-latest.tar.gz

tar -zxvf ../yao-builder-latest.tar.gz -C ../yao-builder

rm -rf ../yao-builder-latest.tar.gz

```

## build the yao application.

```sh
cd yao && make debug1

# check version
yao version
```
