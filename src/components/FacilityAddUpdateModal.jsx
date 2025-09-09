import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  message,
  Row,
  Col,
} from "antd";
import * as facilitiesService from "../services/facilitiesService"; // <- use facilitiesService

const { TextArea } = Input;

function generateAssetCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let randomStr = "";
  for (let i = 0; i < 3; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return randomStr + Date.now().toString().slice(-6);
}

/**
 * Props:
 * - visible: boolean
 * - initial: facility object (may be null for create). If present expected shape includes id and fields.
 * - onClose: () => void
 * - onSaved: () => void  // called after successful create/update
 */
export default function FacilityAddUpdateModal({
  visible,
  initial,
  onClose,
  onSaved,
}) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (initial) {
      const mapDate = (v) => {
        if (!v) return undefined;
        if (v?.toDate) return v.toDate().toISOString().slice(0, 10);
        if (v instanceof Date) return v.toISOString().slice(0, 10);
        if (typeof v === "string") return v.slice(0, 10);
        return undefined;
      };
      form.setFieldsValue({
        name: initial.name || "",
        category: initial.category || "",
        code: initial.code || "",
        location: initial.location || "",
        quantity: initial.quantity ?? 1,
        cost: initial.cost ?? 0,
        status: initial.status || "Đang dùng",
        condition: initial.condition || "",
        purchaseDate: mapDate(initial.purchaseDate),
        warrantyExpiry: mapDate(initial.warrantyExpiry),
        lastMaintenanceDate: mapDate(initial.lastMaintenanceDate),
        nextMaintenanceDate: mapDate(initial.nextMaintenanceDate),
        assignedTo: initial.assignedTo || "",
        notes: initial.notes || "",
      });
    } else {
      form.resetFields();
      form.setFieldsValue({
        quantity: 1,
        cost: 0,
        status: "Đang dùng",
      });
    }
  }, [visible, initial, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload = {
        name: values.name,
        category: values.category || "",
        code: values.code?.trim() || "",
        location: values.location || "",
        quantity:
          typeof values.quantity !== "undefined" ? Number(values.quantity) : 1,
        cost: typeof values.cost !== "undefined" ? Number(values.cost) : 0,
        status: values.status || "Đang dùng",
        condition: values.condition || "",
        purchaseDate: values.purchaseDate || null,
        warrantyExpiry: values.warrantyExpiry || null,
        lastMaintenanceDate: values.lastMaintenanceDate || null,
        nextMaintenanceDate: values.nextMaintenanceDate || null,
        assignedTo: values.assignedTo || "",
        notes: values.notes || "",
      };

      // Check code uniqueness using facilitiesService
      const existingByCode = payload.code
        ? await facilitiesService.findFacilityByCode(payload.code)
        : null;

      if (initial && initial.id) {
        // If editing and code changed, ensure uniqueness
        if (payload.code && payload.code !== (initial.code || "")) {
          if (existingByCode && existingByCode.id !== initial.id) {
            message.error("Mã thiết bị đã tồn tại. Vui lòng chọn mã khác.");
            setLoading(false);
            return;
          }
        }
        await facilitiesService.updateFacility(initial.id, payload);
        message.success("Cập nhật thiết bị thành công");
      } else {
        // create: if no code provided generate one, else check uniqueness
        if (!payload.code) {
          payload.code = generateAssetCode();
        } else if (existingByCode) {
          message.error("Mã thiết bị đã tồn tại. Vui lòng chọn mã khác.");
          setLoading(false);
          return;
        }
        await facilitiesService.createFacility(payload);
        message.success("Thêm thiết bị thành công");
      }

      // Notify parent to reload table
      onSaved && onSaved();
      onClose && onClose();
    } catch (err) {
      if (err?.errorFields) {
        // validation error from antd form
      } else {
        console.error("Facility save error:", err);
        message.error(err?.message || "Lỗi khi lưu thiết bị");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      title={initial ? "Cập nhật thiết bị" : "Thêm thiết bị mới"}
      centered
      getContainer={() => document.querySelector("body")}
      onCancel={() => {
        onClose && onClose();
        form.resetFields();
      }}
      onOk={handleOk}
      okText="Lưu"
      cancelText="Hủy"
      confirmLoading={loading}
      width={520}
      modalClassName="my-compact-modal"
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="Tên thiết bị"
          name="name"
          rules={[{ required: true, message: "Vui lòng nhập tên thiết bị" }]}
        >
          <Input size="middle" placeholder="VD: Máy chiếu" />
        </Form.Item>

        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12}>
            <Form.Item label="Loại" name="category">
              <Input size="middle" placeholder="VD: Thiết bị trình chiếu" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Mã (code)" name="code">
              <Input
                size="middle"
                placeholder="Để trống để tự sinh hoặc nhập mã"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Vị trí" name="location">
          <Input size="middle" placeholder="Phòng / Kho..." />
        </Form.Item>

        <Row gutter={12} align="bottom">
          <Col xs={24} sm={6}>
            <Form.Item
              label="Số lượng"
              name="quantity"
              rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
            >
              <InputNumber size="middle" min={1} style={{ width: "100%" }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={10}>
            <Form.Item label="Giá (VNĐ)" name="cost">
              <InputNumber
                size="middle"
                min={0}
                style={{ width: "100%" }}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
                parser={(v) => v.replace(/\$\s?|(,*)/g, "")}
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item label="Trạng thái" name="status">
              <Select size="middle">
                <Select.Option value="Đang dùng">Đang dùng</Select.Option>
                <Select.Option value="Bảo trì">Bảo trì</Select.Option>
                <Select.Option value="Hỏng">Hỏng</Select.Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={12}>
          <Col xs={24} sm={12}>
            <Form.Item label="Ngày mua" name="purchaseDate">
              <Input
                size="middle"
                type="date"
                style={{ width: "100%", height: 40 }}
              />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item label="Bảo hành đến" name="warrantyExpiry">
              <Input
                size="middle"
                type="date"
                style={{ width: "100%", height: 40 }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item label="Người phụ trách" name="assignedTo">
          <Input size="middle" placeholder="Tên người phụ trách" />
        </Form.Item>

        <Form.Item label="Ghi chú" name="notes">
          <TextArea
            rows={3}
            style={{ fontSize: 14 }}
            placeholder="Ghi chú thêm (nếu có)"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
