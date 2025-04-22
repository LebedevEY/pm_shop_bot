import { useState, useEffect } from 'react';
import {
  Table, Button, Space, Modal, Form, Input, InputNumber, Switch,
  Typography, message, Popconfirm, Image, Upload
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { ProductService } from '../services/product.service';
import { Product } from '../types';
import type { UploadFile } from 'antd';

const { Title } = Typography;
const { TextArea } = Input;

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form] = Form.useForm();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await ProductService.getAll();
      setProducts(data);
    } catch (error) {
      console.log(error);
      message.error('Ошибка при загрузке товаров');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const showAddModal = () => {
    setEditingProduct(null);
    form.resetFields();
    setFileList([]);
    setModalVisible(true);
  };

  const showEditModal = (product: Product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name,
      description: product.description,
      price: product.price,
      isActive: product.isActive,
    });

    // Если есть изображение, добавляем его в fileList
    if (product.imageUrl) {
      setFileList([
        {
          uid: '-1',
          name: 'image.png',
          status: 'done',
          url: product.imageUrl.startsWith('http') ? product.imageUrl : `http://localhost:3000${product.imageUrl}`,
        },
      ]);
    } else {
      setFileList([]);
    }

    setModalVisible(true);
  };

  const handleCancel = () => {
    setModalVisible(false);
    setFileList([]);
  };

  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      // Создаем FormData для отправки файла
      const formData = new FormData();
      Object.keys(values).forEach(key => {
        if (key !== 'image' && values[key] !== undefined) {
          // Преобразуем булевы значения в строки 'true'/'false'
          if (typeof values[key] === 'boolean') {
            formData.append(key, values[key].toString());
          } else {
            formData.append(key, values[key]);
          }
        }
      });

      // Добавляем файл, если он есть
      if (fileList.length > 0 && fileList[0].originFileObj) {
        formData.append('image', fileList[0].originFileObj);
      }

      if (editingProduct) {
        await ProductService.update(editingProduct.id, formData);
        message.success('Товар успешно обновлен');
      } else {
        await ProductService.create(formData);
        message.success('Товар успешно добавлен');
      }

      setModalVisible(false);
      setFileList([]);
      fetchProducts();
    } catch (error) {
      console.log(error);
      message.error('Ошибка при сохранении товара');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await ProductService.delete(id);
      message.success('Товар успешно удален');
      fetchProducts();
    } catch (error) {
      console.log(error)
      message.error('Ошибка при удалении товара');
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      console.log(`Изменение статуса товара ${id} на ${isActive}`);
      
      // Создаем простой объект с строковым значением isActive
      const formData = new FormData();
      formData.append('isActive', isActive ? 'true' : 'false');
      console.log('Данные для отправки:', isActive ? 'true' : 'false');
      
      const result = await ProductService.update(id, formData);
      console.log('Результат обновления:', result);
      
      message.success(`Товар ${isActive ? 'активирован' : 'деактивирован'}`);
      fetchProducts();
    } catch (error) {
      console.error('Ошибка при изменении статуса товара:', error);
      message.error('Ошибка при изменении статуса товара');
    }
  };

  const handleStockQuantityChange = async (id: string, quantity: number) => {
    try {
      console.log(`Изменение количества товара ${id} на ${quantity}`);
      
      // Создаем FormData для отправки данных
      const formData = new FormData();
      formData.append('stockQuantity', quantity.toString());
      
      const result = await ProductService.update(id, formData);
      console.log('Результат обновления количества:', result);
      
      message.success(`Количество товара обновлено`);
      fetchProducts();
    } catch (error) {
      console.error('Ошибка при изменении количества товара:', error);
      message.error('Ошибка при изменении количества товара');
    }
  };

  const columns = [
    {
      title: 'Изображение',
      dataIndex: 'imageUrl',
      key: 'imageUrl',
      render: (imageUrl: string) => (
        imageUrl ? (
          <Image
            src={`http://localhost:3000${imageUrl}`}
            alt="Изображение товара"
            width={80}
            height={80}
            style={{ objectFit: 'cover' }}
          />
        ) : 'Нет изображения'
      ),
    },
    {
      title: 'Название',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Цена',
      dataIndex: 'price',
      key: 'price',
      render: (price: number | null | undefined) => `${Number(price)?.toFixed(2) || 0.00} ₽`,
    },
    {
      title: 'Описание',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (description: string) => description || 'Нет описания',
    },
    {
      title: 'Количество',
      dataIndex: 'stockQuantity',
      key: 'stockQuantity',
      render: (stockQuantity: number, record: Product) => (
        <InputNumber
          min={0}
          defaultValue={stockQuantity || 0}
          style={{ width: '80px' }}
          onBlur={(e) => handleStockQuantityChange(record.id, Number((e.target as HTMLInputElement).value))}
        />
      ),
    },
    {
      title: 'Активен',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean, record: Product) => (
        <Switch 
          checked={isActive} 
          onChange={(checked) => handleToggleActive(record.id, checked)}
        />
      ),
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_val: string, record: Product) => (
        <Space size="large">
          <Button
            type="primary"
            icon={<EditOutlined />}
            onClick={() => showEditModal(record)}
            size="large"
            style={{ fontSize: '20px' }}
          />
          <Popconfirm
            title="Удалить товар?"
            description="Вы уверены, что хотите удалить этот товар?"
            onConfirm={() => handleDelete(record.id)}
            okText="Да"
            cancelText="Нет"
          >
            <Button type="primary" danger icon={<DeleteOutlined />} size="large" style={{ fontSize: '20px' }} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Title level={2}>Товары</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={showAddModal}
        >
          Добавить товар
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={products}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingProduct ? 'Редактировать товар' : 'Добавить товар'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText={editingProduct ? 'Обновить' : 'Добавить'}
        cancelText="Отмена"
      >
        <Form
          form={form}
          layout="vertical"
          name="productForm"
        >
          <Form.Item
            name="name"
            label="Название"
            rules={[{ required: true, message: 'Введите название товара' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="description"
            label="Описание"
            rules={[{ required: true, message: 'Введите описание товара' }]}
          >
            <TextArea rows={4} />
          </Form.Item>

          <Form.Item
            name="price"
            label="Цена"
            rules={[{ required: true, message: 'Введите цену товара' }]}
          >
            <InputNumber
              min={0}
              precision={2}
              style={{ width: '100%' }}
              addonAfter="₽"
            />
          </Form.Item>

          <Form.Item
            name="image"
            label="Изображение"
            valuePropName="fileList"
            getValueFromEvent={(e) => {
              if (Array.isArray(e)) {
                return e;
              }
              return e?.fileList;
            }}
          >
            <Upload
              listType="picture-card"
              fileList={fileList}
              beforeUpload={() => false}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              maxCount={1}
            >
              {fileList.length < 1 && (
                <div>
                  <UploadOutlined />
                  <div style={{ marginTop: 8 }}>Загрузить</div>
                </div>
              )}
            </Upload>
          </Form.Item>

          <Form.Item
            name="stockQuantity"
            label="Количество"
            rules={[{ required: true, message: 'Введите количество товара' }]}
          >
            <InputNumber
              min={0}
              precision={0}
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Активен"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;
