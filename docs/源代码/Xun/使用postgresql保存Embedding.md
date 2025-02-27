# 使用 Postgresql 数据库保存 Embedding

本文学习与探索使用 pg 数据进行 ai 模型处理。

为何使用 pg 数据库，pg 数据库在满足一般的数据库功能的同时，可以使用插件进行功能扩展。比如使用 pgvector 插件保存向量数据，使用 gvector 的另外一个好处是可以平时熟悉的 sql 语句进行数据查询与更新。不需要学习额外的软件使用成本。

## 重要说明：向量维度限制

pgvector 插件有一个重要的限制：向量维度索引不能超过 2000。如果你的应用场景需要处理更高维度的向量，可以考虑使用 [pgvector-rs](https://github.com/tensorchord/pgvecto.rs) 作为替代方案。pgvector-rs 是一个用 Rust 编写的高性能向量相似度搜索引擎，支持更高维度的向量处理。

### pgvector vs pgvector-rs

- pgvector：

  - 最大支持 2000 维向量
  - 安装配置简单
  - 社区活跃，维护良好
  - 适合大多数常见的向量计算场景

- pgvector-rs：
  - 支持更高维度的向量
  - 使用 Rust 编写，性能优秀
  - 适合需要处理高维向量的场景
  - 仍在积极开发中

选择哪个解决方案取决于你的具体需求。如果向量维度索引在 2000 以内，建议使用 pgvector；如果需要处理更高维度的向量，则可以考虑使用 pgvector-rs。

## 前提条件

- 了解 postgresql,需要使用 pg14 或是 pg15 的版本
- 了解 python,langchain
- 了解 ai embedding

## pgvector 安装

项目地址：https://github.com/pgvector/pgvector

### Docker

可以使用 Docker 作验证，但是数据库应用最好不使用容器。

Dockerfile

```sh
FROM ankane/pgvector

LABEL maintainer="Ben M <git@bmagg.com>"

CMD ["postgres"]

EXPOSE 5432
```

运行容器

```sh
docker build -t pgvector .
docker run -itd pgvector -p 5432 -e POSTGRES_DB=default -e POSTGRES_USER=default -e POSTGRES_PASSWORD=secret
```

### Linux 平台

在 linux 平台，pgvector 的安装是比较容易的。

[Linux 服务器快速安装 PostgreSQL15 以及 pgvector 向量插件
](https://blog.csdn.net/feiying101/article/details/135033040)

先设置 pgroot 环境变量，指向 pg 的安装目录

```sh
export PGROOT="<PGDIR>"
```

从源代码安装 pgvector

```sh
cd /tmp
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git
cd pgvector
make
make install # 可能需要sudo
```

在 windows 平台安装 pgvector 会麻烦一点。

### windows 环境准备

需要先安装 vs studio,在配置里设置环境变量 PGROOT，设置 PG 的安装目录。

```sh
PS D:\projects\pg\pgvector> echo $Env:PGROOT
E:\pgsql-14.0
```

### 设置环境变量 PATH

在环境变量里加入 WINDOW 的 cl，namke 等命令目录,在编译时才能找到对应的工具程序。

具体的目录需要根据 vs studio 的目录来修改，这里是示例配置。

```sh
C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.37.32822\bin\Hostx64\x64
```

### 设置环境变量 LIB

LIB，windows 编译程序需要的的 library 目录

检查配置

```sh
PS D:\projects\pg\pgvector> echo $Env:lib
C:\Program Files (x86)\Windows Kits\10\Lib\10.0.22000.0\um\x64;
C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.37.32822\lib\x64;
C:\Program Files (x86)\Windows Kits\10\Lib\10.0.22000.0\ucrt\x64;
```

### 设置环境变量 INCLUDE

程序编译时需要的头文件目录，加入 windows 的头文件目录

检查配置

```sh
PS D:\projects\pg\pgvector> echo $Env:include
C:\Program Files\Microsoft Visual Studio\2022\Community\VC\Tools\MSVC\14.37.32822\include;
C:\Program Files (x86)\Windows Kits\10\Include\10.0.22000.0\ucrt;
C:\Program Files (x86)\Windows Kits\10\Include\10.0.22000.0\shared;
C:\Program Files (x86)\Windows Kits\10\Include\10.0.22000.0\um;
C:\Program Files (x86)\Windows Kits\10\Include\10.0.22000.0\winrt;
```

### pgvector windows 原代码安装，branch 可以在 github 上查找最新的版本

```sh
git clone --branch v0.5.1 https://github.com/pgvector/pgvector.git

nmake /F Makefile.win
nmake /F Makefile.win install
```

编译成功后会自动的把 dll 文件，sql 文件复制到 pg 的安装目录。

```sh
会自动复制文件到 PG 安装目录
copy vector.dll "E:\pgsql-14.0\lib"
已复制 1 个文件。
copy vector.control "E:\pgsql-14.0\share\extension"
已复制 1 个文件。
copy sql\vector--\*.sql "E:\pgsql-14.0\share\extension"
sql\vector--0.1.0--0.1.1.sql
sql\vector--0.1.1--0.1.3.sql
sql\vector--0.1.3--0.1.4.sql
sql\vector--0.1.4--0.1.5.sql
sql\vector--0.1.5--0.1.6.sql
sql\vector--0.1.6--0.1.7.sql
sql\vector--0.1.7--0.1.8.sql
sql\vector--0.1.8--0.2.0.sql
sql\vector--0.2.0--0.2.1.sql
sql\vector--0.2.1--0.2.2.sql
sql\vector--0.2.2--0.2.3.sql
sql\vector--0.2.3--0.2.4.sql
sql\vector--0.2.4--0.2.5.sql
sql\vector--0.2.5--0.2.6.sql
sql\vector--0.2.6--0.2.7.sql
sql\vector--0.2.7--0.3.0.sql
sql\vector--0.3.0--0.3.1.sql
sql\vector--0.3.1--0.3.2.sql
sql\vector--0.3.2--0.4.0.sql
sql\vector--0.4.0--0.4.1.sql
sql\vector--0.4.1--0.4.2.sql
sql\vector--0.4.2--0.4.3.sql
sql\vector--0.4.3--0.4.4.sql
sql\vector--0.4.4--0.5.0.sql
sql\vector--0.5.0--0.5.1.sql
sql\vector--0.5.1.sql
已复制 26 个文件。
mkdir "E:\pgsql-14.0\include\server\extension\vector"
copy src\vector.h "E:\pgsql-14.0\include\server\extension\vector"
已复制 1 个文件。
```

### pgvector 验证

重启 pg 服务

在数据库中执行以下的命令，测试是否安装成功。

```sh
CREATE EXTENSION vector
```

## python 环境准备

python langchain 的环境准备还是比较麻烦的,在使用过程中还需要根据需要安装不同的处理库

```sh
pip install torch text2vect langchain
```

requirements-ai.txt 参考

```sh
aiohttp==3.9.1
aiosignal==1.3.1
annotated-types==0.6.0
anyio==4.2.0
attrs==23.1.0
backoff==2.2.1
beautifulsoup4==4.12.2
blis==0.7.11
catalogue==2.0.10
certifi==2023.11.17
cffi==1.16.0
chardet==5.2.0
charset-normalizer==3.3.2
click==8.1.7
cloudpathlib==0.16.0
colorama==0.4.6
confection==0.1.4
cryptography==41.0.7
cymem==2.0.8
dataclasses-json==0.6.3
datasets==2.16.0
dill==0.3.7
distro==1.9.0
emoji==2.9.0
en-core-web-sm @ https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl#sha256=86cc141f63942d4b2c5fcee06630fd6f904788d2f0ab005cce45aadb8fb73889
fastapi==0.108.0
filelock==3.13.1
filetype==1.2.0
frozenlist==1.4.1
fsspec==2023.10.0
greenlet==3.0.3
grpcio==1.59.2
grpcio-health-checking==1.59.2
grpcio-tools==1.59.2
h11==0.14.0
httpcore==1.0.2
httpx==0.26.0
huggingface-hub==0.20.1
idna==3.6
jieba==0.42.1
Jinja2==3.1.2
joblib==1.3.2
jsonpatch==1.33
jsonpath-python==1.0.6
jsonpointer==2.4
langchain==0.0.353
langchain-community==0.0.7
langchain-core==0.1.4
langcodes==3.3.0
langdetect==1.0.9
langsmith==0.0.75
loguru==0.7.2
lxml==5.0.0
Markdown==3.5.1
MarkupSafe==2.1.3
marshmallow==3.20.1
mpmath==1.3.0
multidict==6.0.4
multiprocess==0.70.15
murmurhash==1.0.10
mypy-extensions==1.0.0
networkx==3.2.1
nltk==3.8.1
numpy==1.26.2
openai==1.6.1
packaging==23.2
pandas==2.1.4
pdfminer.six==20231228
preshed==3.0.9
protobuf==4.25.0
psycopg2==2.9.9
pyarrow==14.0.2
pyarrow-hotfix==0.6
pycparser==2.21
pydantic==2.5.3
pydantic_core==2.14.6
python-dateutil==2.8.2
python-iso639==2023.12.11
python-magic==0.4.27
pytz==2023.3.post1
PyYAML==6.0.1
rapidfuzz==3.6.1
regex==2023.12.25
requests==2.31.0
safetensors==0.4.1
scikit-learn==1.3.2
scipy==1.11.4
six==1.16.0
smart-open==6.4.0
sniffio==1.3.0
soupsieve==2.5
spacy==3.7.2
spacy-legacy==3.0.12
spacy-loggers==1.0.5
SQLAlchemy==2.0.24
srsly==2.4.8
starlette==0.32.0.post1
sympy==1.12
tabulate==0.9.0
tenacity==8.2.3
text2vec==1.2.9
thinc==8.2.2
threadpoolctl==3.2.0
tokenizers==0.15.0
torch==2.1.2
tqdm==4.66.1
transformers==4.36.2
typer==0.9.0
typing-inspect==0.9.0
typing_extensions==4.9.0
tzdata==2023.4
unstructured==0.11.6
unstructured-client==0.15.1
urllib3==2.1.0
uvicorn==0.25.0
wasabi==1.1.2
weasel==0.3.4
win32-setctime==1.1.0
wrapt==1.16.0
xxhash==3.4.1
yarl==1.9.4
```

## 网络环境

使用离线模型需要从https://huggingface.co/上下载文件，在国内是无法访问的，需要使用代理。

在 python 代码中可以使用以下的方式挂载代理。

```python
import os
os.environ['HTTP_PROXY'] = 'http://127.0.0.1:10809'
os.environ['HTTPS_PROXY'] = 'http://127.0.0.1:10809'
```

## 文件加载

文件加载可使用 langchain 中的各种文件加载处理器。

加载文件，不同的文件对应不同的加载器

```py
import os
import glob
from typing import List
from multiprocessing import Pool
from tqdm import tqdm
from langchain.document_loaders import (
    CSVLoader,
    EverNoteLoader,
    PDFMinerLoader,
    TextLoader,
    UnstructuredEmailLoader,
    UnstructuredEPubLoader,
    UnstructuredHTMLLoader,
    UnstructuredMarkdownLoader,
    UnstructuredODTLoader,
    UnstructuredPowerPointLoader,
    UnstructuredWordDocumentLoader,
)
from langchain.docstore.document import Document


# Map file extensions to document loaders and their arguments
LOADER_MAPPING = {
    ".csv": (CSVLoader, {}),
    ".doc": (UnstructuredWordDocumentLoader, {}),
    ".docx": (UnstructuredWordDocumentLoader, {}),
    ".enex": (EverNoteLoader, {}),
    ".epub": (UnstructuredEPubLoader, {}),
    ".html": (UnstructuredHTMLLoader, {}),
    ".md": (UnstructuredMarkdownLoader, {}),
    ".odt": (UnstructuredODTLoader, {}),
    ".pdf": (PDFMinerLoader, {}),
    ".ppt": (UnstructuredPowerPointLoader, {}),
    ".pptx": (UnstructuredPowerPointLoader, {}),
    ".txt": (TextLoader, {"encoding": "utf8"}),
}
```

加载单个文件

```py
def load_single_document(file_path: str) -> Document:
    ## Find extension of the file
    ext = "." + file_path.rsplit(".", 1)[-1]
    if ext in LOADER_MAPPING:
        # Find the appropriate loader class and arguments
        loader_class, loader_args = LOADER_MAPPING[ext]
        # Invoke the instance of document loader
        loader = loader_class(file_path, **loader_args)
        ## Return the loaded document
        return loader.load()[0]
    raise ValueError(f"Unsupported file extension '{ext}'")

git_dir = "../../../../privateGPT/"
loaded_document = load_single_document(git_dir+'source_documents/state_of_the_union.txt')
print(f'Type of loaded document {type(loaded_document)}')
loaded_document
```

加载目录中所有的文件

```py
def load_documents(source_dir: str, ignored_files: List[str] = []) -> List[Document]:
    """
    Loads all documents from the source documents directory, ignoring specified files
    """
    all_files = []
    for ext in LOADER_MAPPING:
        #Find all the files within source documents which matches the extensions in Loader_Mapping file
        all_files.extend(
            glob.glob(os.path.join(source_dir, f"**/*{ext}"), recursive=True)
        )

    ## Filtering files from all_files if its in ignored_files
    filtered_files = [file_path for file_path in all_files if file_path not in ignored_files]

    ## Spinning up resource pool
    with Pool(processes=os.cpu_count()) as pool:
        results = []
        with tqdm(total=len(filtered_files), desc='Loading new documents', ncols=80) as pbar:
            # Load each document from filtered files list using load_single_document function
            for i, doc in enumerate(pool.imap_unordered(load_single_document, filtered_files)):
                results.append(doc)
                pbar.update()

    return results


loaded_documents = load_documents(git_dir+'source_documents')
print(f"Length of loaded documents: {len(loaded_documents)}")
loaded_documents[0]
```

## 文本分块

递归处理器

```py
from langchain.text_splitter import RecursiveCharacterTextSplitter

chunk_size = 500
chunk_overlap = 50
def process_documents(source_dir: str, ignored_files: List[str] = []) -> List[Document]:
    """
    Load documents and split in chunks
    """
    print(f"Loading documents from {source_dir}")
    documents = load_documents(source_dir, ignored_files)
    if not documents:
        print("No new documents to load")
        exit(0)
    print(f"Loaded {len(documents)} new documents from {source_dir}")
    ## Load text splitter
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    ## Split text
    texts = text_splitter.split_documents(documents)
    print(f"Split into {len(texts)} chunks of text (max. {chunk_size} tokens each)")
    return texts
processed_documents = process_documents(git_dir+'source_documents')
```

NLTKTextSplitter 下载使用代理

```python
import nltk
nltk.set_proxy('http://127.0.0.1:10809')
# nltk.set_proxy('http://proxy.example.com:3128' ('USERNAME', 'PASSWORD'))
nltk.download('punkt')
```

SpacyTextSplitter 无法使用代理，可以直接 github 上下载文件。

```sh
pip3 install spacy
python3 -m spacy download en_core_web_sm

pip3 install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.1/en_core_web_sm-3.7.1-py3-none-any.whl
```

## 文件转换向量

在 ai 模型处理解决方案上，python 的 langchain 是很好的工具，它提供了 ai 模型相关的工具链。

在这里也是利用 langchain 的部分功能。

文件转换成向量有两种方法，一是直接使用 openai 的模型`text-embedding-ada-002`,另外一种是使用开源项目，比如[text2vec](https://github.com/shibing624/text2vec)。openai 的输出向量数量是 1536。

中文分词比较好的两个模型，并且支持使用 cpu 处理。

- [shibing624/text2vec-bge-large-chinese](https://huggingface.co/shibing624/text2vec-bge-large-chinese)，输出向量数量是 1024
- [text2vec-base-chinese-sentence](https://huggingface.co/shibing624/text2vec-base-chinese-sentence)，输出向量数量是 768

不同模型输出的向量数量/维度不同，对应的数据库的字段设置也需要调整。

OPENAI 模型

```py

def embed_OpenAi(document:Document):
    """
    使用openai 的接口作获取向量信息
    """
    api_key = os.getenv("OPENAI_API_KEY")

    client = OpenAI(api_key=api_key)
    # Your text input
    text = document.page_content
    # Get the embedding
    response = client.embeddings.create(
        input=text,
        model="text-embedding-ada-002"  # Example model
    )
    # print("response",response)
    # The embedding vector
    embedding_vector = response.data[0].embedding
    return embedding_vector
    # You can now use this vector for further processing

```

使用本地 HF 模型，会自动的自裁 HF 文件，需要提前配置好网络环境，或是手动下载模型文件再手动安装.

```py
from text2vec import SentenceModel

s_model = SentenceModel("shibing624/text2vec-bge-large-chinese")

def embedding(document:Document):
    """
    使用本地模型处理向量信息
    """
    embeddings = s_model.encode(document.page_content, normalize_embeddings=True)
    return embeddings.tolist()
```

## 数据库保存

使用库 psycopg2，可以在 python 中直接保存向量数据到 pg 数据库。

```py
def insert_vector_data(conn_str, table_name, vector_field, filename,content,vector_data):
    """
    Inserts vector data into a PostgreSQL table with a pgvector column.

    Parameters:
    conn_str (str): The connection string for the database.
    table_name (str): The name of the table to insert data into.
    vector_data (list): The vector data to insert (as a list of floats).
    """
    try:
        # Connect to the database using the connection string
        conn = psycopg2.connect(conn_str)
        cur = conn.cursor()
        from psycopg2.extensions import adapt, AsIs
        vector_data_adapted = AsIs(adapt(vector_data))

        # Insert the vector data
        cur.execute(f"INSERT INTO {table_name} (filename,content,{vector_field}) VALUES (%s,%s,%s);", (filename,content,vector_data_adapted))

        # Commit the transaction and close the connection
        conn.commit()
        cur.close()
        conn.close()

        return "Data inserted successfully."
```

## 源代码

测试的项目地址：

https://github.com/wwsheng009/yao-plugin-python

## 参考

[Linux 服务器快速安装 PostgreSQL15 以及 pgvector 向量插件](https://blog.csdn.net/feiying101/article/details/135033040)
[（五）Langchain PGVector 补充智能客服匹配式问答](https://blog.csdn.net/q116975174/article/details/131038366)
