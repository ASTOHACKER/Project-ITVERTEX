// 1. React & React Native
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  Share,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 2. Third-party / Expo
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import CustomAlert from '@/components/ui/CustomAlert';

// 3. API helpers
import { getRepair, verifyPayment } from '@/lib/api';
import type { RepairJob } from '@/types/repair';

export default function ReceiptScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ jobId?: string; job_id?: string; job_no?: string; id?: string }>();
  const rawTarget = params.jobId || params.job_id || params.id || '';
  const fromJobNo = params.job_no ? (params.job_no.split('-').pop() || params.job_no.replace(/[^0-9]/g, '')) : '';
  const targetId = rawTarget || fromJobNo;

  const [job, setJob] = useState<RepairJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'warning' | 'danger' | 'info';
    onConfirm?: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showAlert = (
    title: string,
    message: string,
    type: 'success' | 'warning' | 'danger' | 'info' = 'danger',
    onConfirm?: () => void
  ) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      type,
      onConfirm,
    });
  };

  useEffect(() => {
    if (targetId) {
      fetchJob();
    } else {
      setLoading(false);
    }
  }, [targetId]);

  async function fetchJob() {
    try {
      setLoading(true);
      const res = await getRepair(targetId);
      if (res.success && res.data) {
        const data = res.data;

        let warrantyText = '-';
        if (data.warranty_year && Number(data.warranty_year) > 0) {
          warrantyText = `${data.warranty_year} ปี`;
          if (data.warranty_end_date) {
            try {
              const end = new Date(data.warranty_end_date);
              if (!isNaN(end.getTime())) {
                warrantyText += ` (หมด ${end.toLocaleDateString('th-TH')})`;
              }
            } catch {}
          }
        } else if (data.warranty_year === 0) {
          warrantyText = 'ไม่มีประกัน / หมดประกัน';
        }

        const isCancelledJob =
          Boolean(data.is_cancelled) ||
          Number(data.status_id) === 9 ||
          Number(data.quote_status_id) === 3 ||
          Number(data.quotation?.quote_status_id) === 3 ||
          String(data.status || data.status_name || '').includes('ยกเลิก');

        const cancelFee = Number(data.total_cancel_price) || Number(data.quotation?.total_cancel_price) || 300;
        const repairPrice = Number(data.total_repair_price) || Number(data.quotation?.total_repair_price) || Number(data.total_amount) || 0;
        const computedTotal = isCancelledJob ? cancelFee : (repairPrice > 0 ? repairPrice : Number(data.total_amount) || 0);

        setJob({
          ...data,
          id: String(data.job_id || targetId),
          job_number: data.job_number || data.job_no || `REP-${String(data.job_id || targetId).padStart(6, '0')}`,
          customer_name:
            data.customer_name ||
            `${data.first_name || ''} ${data.last_name || ''}`.trim() ||
            'ลูกค้าทั่วไป',
          phone: data.phone || '-',
          email: data.email || '-',
          device_type: data.device_type || '-',
          brand: data.brand || '-',
          model: data.model || '-',
          serial_number: data.serial_number || '-',
          accessories: data.included_accessories || data.accessories || '-',
          important_software: data.important_software || data.important_programs || '-',
          device_password: data.device_password || data.password || '-',
          warranty_info: warrantyText,
          symptoms: data.symptom || data.symptoms || data.symptom_details || '-',
          actual_symptom: data.actual_symptom || '-',
          items: data.quotation?.items || data.items || [],
          quotation: data.quotation || null,
          status: data.status_name || data.status || (data.status_id === 8 ? 'เสร็จสิ้น' : 'กำลังดำเนินการ'),
          status_id: data.status_id,
          total_amount: computedTotal,
          total_cancel_price: cancelFee,
          total_repair_price: repairPrice,
          is_cancelled: isCancelledJob,
          created_at: data.created_at || new Date().toISOString(),
          payment_date: data.payment_date || null,
          payment_method_name: data.payment_method_name || 'โอนเงิน / สแกน QR (Transfer)',
          payment_verified: data.payment_verified ?? false,
          received_by: data.received_by || 'เจ้าหน้าที่ศูนย์บริการ',
          repairer_name: data.repairer_name || data.technician_name || '-',
          inspector_name: data.inspector_name || data.technician_name || '-',
        });
      } else {
        setJob(null);
      }
    } catch (err: any) {
      console.error('Receipt fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  }

  const isIntake = job?.status_id === 1 || job?.status === 'รอตรวจเช็ค' || job?.status === 'รอตรวจสอบ';
  const isCompleted = job?.status_id === 8 || job?.status === 'เสร็จสิ้น' || job?.status === 'ชำระแล้ว' || job?.status === 'ส่งมอบแล้ว';
  const isCancelled =
    Boolean(job?.is_cancelled) ||
    Number(job?.status_id) === 9 ||
    Number(job?.quote_status_id) === 3 ||
    Number(job?.quotation?.quote_status_id) === 3 ||
    String(job?.status || '').includes('ยกเลิก');
  const isSupportedDocument = isIntake || isCompleted || (isCancelled && Boolean(job?.payment_verified));

  const cancelFee =
    Number(job?.total_cancel_price) ||
    Number(job?.quotation?.total_cancel_price) ||
    300;

  const regularItems = job?.items && Array.isArray(job.items) ? job.items : [];
  const regularItemsTotal = regularItems.reduce(
    (sum: number, item: any) =>
      sum + (Number(item.price || item.unit_price) * Number(item.quantity || item.qty || 1) || 0),
    0
  );

  const grandTotal = isCancelled
    ? cancelFee
    : (regularItemsTotal > 0
        ? regularItemsTotal
        : (Number(job?.total_repair_price) || Number(job?.total_amount) || 0));

  const vat = Math.round(((grandTotal * 7) / 107) * 100) / 100;
  const subtotal = Math.round((grandTotal - vat) * 100) / 100;

  const items = isCancelled
    ? [
        {
          name: 'ค่าบริการตรวจเช็คสภาพเครื่อง (กรณีลูกค้ายกเลิกซ่อม)',
          item_name: 'ค่าบริการตรวจเช็คสภาพเครื่อง (กรณีลูกค้ายกเลิกซ่อม)',
          quantity: 1,
          qty: 1,
          price: grandTotal,
          unit_price: grandTotal,
          total_price: grandTotal,
          item_type_id: 2,
          item_type_name: 'บริการ',
        },
      ]
    : regularItems;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr || dateStr === '-' || dateStr === 'undefined') return '-';
    try {
      return new Date(dateStr).toLocaleDateString('th-TH', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return String(dateStr);
    }
  };

  const formatNumber = (n: number) =>
    n.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const handleConfirmPayment = async () => {
    if (!job) return;
    try {
      await verifyPayment(job.id || job.job_id || targetId);
      setJob({ ...job, status: 'เสร็จสิ้น', status_id: 8, payment_verified: true });
      showAlert('สำเร็จ', 'ยืนยันการชำระเงินเรียบร้อยแล้ว', 'success');
    } catch (err: any) {
      showAlert('ล้มเหลว', err.message || 'ไม่สามารถยืนยันการชำระเงินได้', 'danger');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. เทมเพลต: ใบรับซ่อมอุปกรณ์ (Repair Intake Ticket - ไม่บอกราคา)
  // ─────────────────────────────────────────────────────────────
  const generateIntakeSlipHtml = (j: any) => {
    const createdDateStr = j.created_at
      ? new Date(j.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
      : '-';

    return `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="utf-8">
        <title>ใบรับซ่อม ${j.job_number}</title>
        <style>
          * { box-sizing: border-box; }
          @page {
            size: A4 portrait;
            margin: 15mm 15mm;
          }
          body {
            font-family: 'Helvetica Neue', 'Prompt', 'Kanit', Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 24px;
            background: #ffffff;
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #dc2626;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }
          .brand-name {
            font-size: 24px;
            font-weight: 800;
            color: #dc2626;
            margin: 0 0 2px 0;
            letter-spacing: -0.5px;
          }
          .brand-desc {
            font-size: 11px;
            color: #64748b;
            margin: 0 0 2px 0;
          }
          .doc-header {
            text-align: right;
          }
          .doc-title {
            margin: 0;
            font-size: 19px;
            font-weight: 800;
            color: #0f172a;
          }
          .doc-sub {
            margin: 2px 0 0 0;
            font-size: 11px;
            color: #64748b;
          }
          .status-badge {
            display: inline-block;
            border: 1.5px solid #dc2626;
            color: #dc2626;
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 6px;
            margin-top: 6px;
            font-size: 11px;
            background: rgba(220, 38, 38, 0.05);
          }
          .section-card {
            background: #f8fafc;
            padding: 14px 16px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
            margin-bottom: 14px;
          }
          .section-title {
            margin: 0 0 8px 0;
            font-size: 12px;
            font-weight: 700;
            color: #dc2626;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px 20px;
          }
          .grid-3 {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 12px 16px;
          }
          .info-row {
            margin-bottom: 5px;
            font-size: 12px;
          }
          .info-lbl {
            color: #64748b;
            font-weight: 500;
            display: inline-block;
            min-width: 90px;
          }
          .info-val {
            font-weight: 600;
            color: #0f172a;
          }
          .terms-box {
            background: #fff;
            border: 1px dashed #cbd5e1;
            padding: 10px 14px;
            border-radius: 8px;
            margin-top: 14px;
            margin-bottom: 24px;
          }
          .terms-title {
            font-size: 11px;
            font-weight: 700;
            color: #475569;
            margin-bottom: 4px;
          }
          .terms-list {
            margin: 0;
            padding-left: 16px;
            font-size: 10.5px;
            color: #64748b;
            line-height: 1.4;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 24px;
            padding-top: 10px;
          }
          .sig-card {
            width: 240px;
            text-align: center;
          }
          .sig-line {
            border-bottom: 1px dashed #94a3b8;
            height: 48px;
            margin-bottom: 8px;
          }
          .sig-txt {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          .footer-note {
            margin-top: 28px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            text-align: center;
            font-size: 10.5px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-name">IT VERTEX</h1>
            <p class="brand-desc">ศูนย์บริการตรวจเช็คและซ่อมคอมพิวเตอร์ครบวงจร</p>
            <p class="brand-desc">โทร: 02-123-4567 • www.itvertex.com</p>
          </div>
          <div class="doc-header">
            <h2 class="doc-title">ใบรับซ่อมอุปกรณ์</h2>
            <p class="doc-sub">REPAIR INTAKE TICKET</p>
            <div class="status-badge">${j.status || 'รอตรวจเช็ค'}</div>
          </div>
        </div>

        <div class="section-card">
          <div class="grid-3">
            <div>
              <div class="info-row"><span class="info-lbl">เลขที่ใบรับซ่อม:</span> <span class="info-val" style="color:#dc2626; font-size:13px;">${j.job_number}</span></div>
              <div class="info-row"><span class="info-lbl">วันที่รับเครื่อง:</span> <span class="info-val">${createdDateStr}</span></div>
            </div>
            <div>
              <div class="info-row"><span class="info-lbl">ชื่อลูกค้า:</span> <span class="info-val">${j.customer_name}</span></div>
              <div class="info-row"><span class="info-lbl">เบอร์โทรศัพท์:</span> <span class="info-val">${j.phone}</span></div>
            </div>
            <div>
              <div class="info-row"><span class="info-lbl">อีเมล:</span> <span class="info-val">${j.email || '-'}</span></div>
              <div class="info-row"><span class="info-lbl">ผู้รับเครื่อง:</span> <span class="info-val">${j.received_by || '-'}</span></div>
            </div>
          </div>
        </div>

        <div class="section-card">
          <h3 class="section-title">ข้อมูลอุปกรณ์และสเปกเครื่อง (Device Specifications)</h3>
          <div class="grid-2">
            <div>
              <div class="info-row"><span class="info-lbl">ประเภทอุปกรณ์:</span> <span class="info-val">${j.device_type}</span></div>
              <div class="info-row"><span class="info-lbl">ยี่ห้อ / แบรนด์:</span> <span class="info-val">${j.brand}</span></div>
              <div class="info-row"><span class="info-lbl">รุ่น / สเปกเครื่อง:</span> <span class="info-val">${j.model}</span></div>
              <div class="info-row"><span class="info-lbl">หมายเลข S/N:</span> <span class="info-val">${j.serial_number || '-'}</span></div>
            </div>
            <div>
              <div class="info-row"><span class="info-lbl">อุปกรณ์ที่นำมาด้วย:</span> <span class="info-val">${j.accessories || '-'}</span></div>
              <div class="info-row"><span class="info-lbl">โปรแกรม/ข้อมูลสำคัญ:</span> <span class="info-val">${j.important_software || '-'}</span></div>
              <div class="info-row"><span class="info-lbl">รหัสผ่านเครื่อง (PIN):</span> <span class="info-val">${j.device_password || '-'}</span></div>
              <div class="info-row"><span class="info-lbl">การรับประกัน:</span> <span class="info-val">${j.warranty_info || '-'}</span></div>
            </div>
          </div>
        </div>

        <div class="section-card">
          <h3 class="section-title">รายละเอียดอาการแจ้งซ่อม (Symptom Details)</h3>
          <div class="info-row" style="margin-bottom: 6px;">
            <span class="info-lbl" style="min-width: 110px;">อาการที่ลูกค้าแจ้ง:</span>
            <span class="info-val" style="color: #0f172a;">${j.symptoms || '-'}</span>
          </div>
          ${j.actual_symptom && j.actual_symptom !== '-' ? `
            <div class="info-row">
              <span class="info-lbl" style="min-width: 110px;">อาการตรวจพบจริง:</span>
              <span class="info-val" style="color: #0284c7;">${j.actual_symptom}</span>
            </div>
          ` : ''}
        </div>

        <div class="terms-box">
          <div class="terms-title">ข้อตกลงและเงื่อนไขการรับบริการ (Service Terms & Agreement)</div>
          <ol class="terms-list">
            <li>กรุณานำใบรับซ่อมฉบับนี้มาแสดงเป็นหลักฐานทุกครั้งในการติดต่อรับเครื่องคืน</li>
            <li>ทางศูนย์บริการจะตรวจเช็คสภาพเครื่องและแจ้งประเมินราคาให้ลูกค้าอนุมัติก่อนเริ่มดำเนินการซ่อม</li>
            <li>เพื่อความปลอดภัยของข้อมูลส่วนบุคคล กรุณาสำรองข้อมูลสำคัญก่อนส่งซ่อม ทางร้านขอสงวนสิทธิ์ไม่รับผิดชอบต่อความสูญหายของข้อมูลทุกกรณี</li>
          </ol>
        </div>

        <div class="signatures">
          <div class="sig-card">
            <div class="sig-line"></div>
            <div class="sig-txt">ลงชื่อ ....................................................</div>
            <div class="sig-txt" style="font-weight: 600;">(${j.customer_name})</div>
            <div class="sig-txt">ลูกค้า / ผู้ส่งเครื่องซ่อม</div>
          </div>
          <div class="sig-card">
            <div class="sig-line"></div>
            <div class="sig-txt">ลงชื่อ ....................................................</div>
            <div class="sig-txt" style="font-weight: 600;">(${j.received_by || 'เจ้าหน้าที่ศูนย์บริการ'})</div>
            <div class="sig-txt">เจ้าหน้าที่ / ผู้รับเครื่องซ่อม</div>
          </div>
        </div>

        <div class="footer-note">
          ขอบพระคุณที่ไว้วางใจใช้บริการ IT VERTEX • ให้บริการตรวจเช็คและซ่อมโดยช่างผู้เชี่ยวชาญ
        </div>
      </body>
      </html>
    `;
  };

  // ─────────────────────────────────────────────────────────────
  // 2. เทมเพลต: ใบเสร็จรับเงิน (Receipt - มีแจกแจงราคาและภาษี)
  // ─────────────────────────────────────────────────────────────
  const generateReceiptHtml = (j: any, sub: number, v: number, grand: number) => {
    const isCancelledDoc =
      Boolean(j.is_cancelled) ||
      Number(j.status_id) === 9 ||
      Number(j.quote_status_id) === 3 ||
      Number(j.quotation?.quote_status_id) === 3 ||
      String(j.status || '').includes('ยกเลิก');

    const itms = isCancelledDoc
      ? [
          {
            name: 'ค่าบริการตรวจเช็คสภาพเครื่อง (กรณีลูกค้ายกเลิกซ่อม)',
            item_name: 'ค่าบริการตรวจเช็คสภาพเครื่อง (กรณีลูกค้ายกเลิกซ่อม)',
            quantity: 1,
            qty: 1,
            unit_price: grand,
            price: grand,
            total_price: grand,
            item_type_id: 2,
          },
        ]
      : (j.items && Array.isArray(j.items) ? j.items : []);

    const itemsHtml =
      itms.length > 0
        ? itms
            .map((it: any, idx: number) => {
              const qty = Number(it.quantity || it.qty || 1);
              const price = Number(it.unit_price || it.price || 0);
              const total = Number(it.total_price) || qty * price;
              const isService = it.item_type_id === 2 || !it.item_id;
              const typeLabel = isService
                ? '<span style="display:inline-block;font-size:10px;font-weight:700;padding:1px 6px;border-radius:6px;background:#e0f2fe;color:#0284c7;margin-left:6px;">บริการ</span>'
                : '<span style="display:inline-block;font-size:10px;font-weight:700;padding:1px 6px;border-radius:6px;background:#fee2e2;color:#dc2626;margin-left:6px;">อะไหล่</span>';

              return `
              <tr>
                <td style="text-align: center; width: 40px; padding: 10px 8px; border-bottom: 1px solid #f1f5f9;">${idx + 1}</td>
                <td style="padding: 10px 8px; border-bottom: 1px solid #f1f5f9;">
                  <span style="font-weight: 600; color: #1e293b;">${it.name || it.item_name || 'รายการ'}</span>
                  ${typeLabel}
                </td>
                <td style="text-align: center; width: 60px; padding: 10px 8px; border-bottom: 1px solid #f1f5f9;">${qty} รายการ</td>
                <td style="text-align: right; width: 110px; padding: 10px 8px; border-bottom: 1px solid #f1f5f9;">฿${price.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
                <td style="text-align: right; width: 120px; font-weight: 700; color: #1e293b; padding: 10px 8px; border-bottom: 1px solid #f1f5f9;">฿${total.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
              </tr>
            `;
            })
            .join('')
        : `<tr><td colspan="5" style="text-align: center; padding: 20px; color: #94a3b8;">ไม่มีรายการ</td></tr>`;

    const paidDateStr = j.payment_date
      ? new Date(j.payment_date).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'ชำระแล้ว';
    const createdDateStr = j.created_at
      ? new Date(j.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })
      : '-';

    return `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="utf-8">
        <title>ใบเสร็จรับเงิน ${j.job_number}</title>
        <style>
          * { box-sizing: border-box; }
          @page {
            size: A4 portrait;
            margin: 15mm 15mm;
          }
          body {
            font-family: 'Helvetica Neue', 'Prompt', 'Kanit', Arial, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 24px;
            background: #ffffff;
            font-size: 13px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #dc2626;
            padding-bottom: 14px;
            margin-bottom: 18px;
          }
          .brand-name {
            font-size: 24px;
            font-weight: 800;
            color: #dc2626;
            margin: 0 0 2px 0;
            letter-spacing: -0.5px;
          }
          .brand-desc {
            font-size: 11px;
            color: #64748b;
            margin: 0 0 2px 0;
          }
          .doc-header {
            text-align: right;
          }
          .doc-title {
            margin: 0;
            font-size: 19px;
            font-weight: 800;
            color: #0f172a;
          }
          .doc-sub {
            margin: 2px 0 0 0;
            font-size: 11px;
            color: #64748b;
          }
          .paid-badge {
            display: inline-block;
            border: 2px solid #16a34a;
            color: #16a34a;
            font-weight: 800;
            padding: 3px 10px;
            border-radius: 6px;
            margin-top: 6px;
            font-size: 11px;
            background: rgba(220, 38, 38, 0.06);
          }
          .info-container {
            display: flex;
            justify-content: space-between;
            gap: 16px;
            margin-bottom: 20px;
            background: #f8fafc;
            padding: 14px 16px;
            border-radius: 10px;
            border: 1px solid #e2e8f0;
          }
          .info-col {
            flex: 1;
          }
          .info-col h3 {
            margin: 0 0 8px 0;
            font-size: 11.5px;
            font-weight: 700;
            color: #dc2626;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .info-item {
            margin-bottom: 4px;
            font-size: 12px;
          }
          .info-lbl {
            color: #64748b;
            display: inline-block;
            min-width: 75px;
          }
          .info-val {
            font-weight: 600;
            color: #0f172a;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background: #f1f5f9;
            color: #475569;
            font-weight: 700;
            padding: 9px 8px;
            text-align: left;
            font-size: 11.5px;
            border-bottom: 2px solid #cbd5e1;
          }
          .totals-wrap {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 24px;
          }
          .totals-table {
            width: 320px;
            border-collapse: collapse;
          }
          .totals-table td {
            padding: 5px 10px;
            border: none;
            font-size: 12.5px;
          }
          .totals-table .grand-row {
            background: #fef2f2;
            border-top: 2px solid #dc2626;
            border-bottom: 2px solid #dc2626;
            color: #dc2626;
            font-size: 15px;
            font-weight: 800;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 30px;
            padding-top: 10px;
          }
          .sig-card {
            width: 230px;
            text-align: center;
          }
          .sig-line {
            border-bottom: 1px dashed #94a3b8;
            height: 44px;
            margin-bottom: 8px;
          }
          .sig-txt {
            font-size: 11px;
            color: #64748b;
            margin-top: 2px;
          }
          .footer-note {
            margin-top: 28px;
            border-top: 1px solid #e2e8f0;
            padding-top: 10px;
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="brand-name">IT VERTEX</h1>
            <p class="brand-desc">ศูนย์บริการตรวจเช็คและซ่อมคอมพิวเตอร์ครบวงจร</p>
            <p class="brand-desc">โทร: 02-123-4567 • www.itvertex.com</p>
          </div>
          <div class="doc-header">
            <h2 class="doc-title">${isCancelledDoc ? 'ใบเสร็จรับเงิน (ค่าตรวจเช็คเครื่อง)' : 'ใบเสร็จรับเงิน'}</h2>
            <p class="doc-sub">${isCancelledDoc ? 'RECEIPT (INSPECTION FEE)' : 'RECEIPT / TAX INVOICE'}</p>
            <div class="paid-badge">${isCancelledDoc ? '✓ ชำระค่าตรวจเช็คแล้ว (PAID)' : '✓ ชำระแล้ว (PAID)'}</div>
          </div>
        </div>

        <div class="info-container">
          <div class="info-col">
            <h3>ข้อมูลลูกค้า (Customer)</h3>
            <div class="info-item"><span class="info-lbl">ชื่อลูกค้า:</span> <span class="info-val">${j.customer_name}</span></div>
            <div class="info-item"><span class="info-lbl">เบอร์โทร:</span> <span class="info-val">${j.phone}</span></div>
            <div class="info-item"><span class="info-lbl">อีเมล:</span> <span class="info-val">${j.email || '-'}</span></div>
          </div>
          <div class="info-col">
            <h3>ข้อมูลอุปกรณ์ (Device)</h3>
            <div class="info-item"><span class="info-lbl">อุปกรณ์:</span> <span class="info-val">${j.device_type}</span></div>
            <div class="info-item"><span class="info-lbl">ยี่ห้อ/รุ่น:</span> <span class="info-val">${j.brand} ${j.model}</span></div>
            <div class="info-item"><span class="info-lbl">S/N:</span> <span class="info-val">${j.serial_number}</span></div>
            <div class="info-item"><span class="info-lbl">อาการแจ้ง:</span> <span class="info-val">${j.symptoms}</span></div>
          </div>
          <div class="info-col">
            <h3>ข้อมูลการชำระเงิน (Payment)</h3>
            <div class="info-item"><span class="info-lbl">เลขที่งาน:</span> <span class="info-val">${j.job_number}</span></div>
            <div class="info-item"><span class="info-lbl">วันที่รับ:</span> <span class="info-val">${createdDateStr}</span></div>
            <div class="info-item"><span class="info-lbl">วันที่ชำระ:</span> <span class="info-val">${paidDateStr}</span></div>
            <div class="info-item"><span class="info-lbl">ช่องทาง:</span> <span class="info-val">${j.payment_method_name || 'โอนเงิน / สแกน QR'}</span></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="text-align: center; width: 40px;">ลำดับ</th>
              <th>รายการบริการ / อะไหล่</th>
              <th style="text-align: center; width: 80px;">จำนวน</th>
              <th style="text-align: right; width: 110px;">ราคาต่อหน่วย</th>
              <th style="text-align: right; width: 120px;">รวมเงิน (บาท)</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals-wrap">
          <table class="totals-table">
            <tr>
              <td style="color: #64748b;">รวมเป็นเงิน (Subtotal):</td>
              <td style="text-align: right; font-weight: 600;">฿${sub.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style="color: #64748b;">ภาษีมูลค่าเพิ่ม (VAT 7% Included):</td>
              <td style="text-align: right; font-weight: 600;">฿${v.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr class="grand-row">
              <td>ยอดชำระสุทธิ (Net Total):</td>
              <td style="text-align: right;">฿${grand.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
            </tr>
          </table>
        </div>

        <div class="signatures">
          <div class="sig-card">
            <div class="sig-line"></div>
            <div class="sig-txt">ลงชื่อ ....................................................</div>
            <div class="sig-txt" style="font-weight: 600;">(${j.customer_name})</div>
            <div class="sig-txt">ลูกค้า / ผู้รับเครื่อง</div>
          </div>
          <div class="sig-card">
            <div class="sig-line"></div>
            <div class="sig-txt">ลงชื่อ ....................................................</div>
            <div class="sig-txt" style="font-weight: 600;">(${j.repairer_name !== '-' ? j.repairer_name : 'เจ้าหน้าที่ศูนย์บริการ'})</div>
            <div class="sig-txt">ผู้รับเงิน / เจ้าหน้าที่</div>
          </div>
        </div>

        <div class="footer-note">
          ขอบพระคุณที่ไว้วางใจใช้บริการ IT VERTEX • สินค้ารับประกันงานซ่อมตามเงื่อนไขที่กำหนด
        </div>
      </body>
      </html>
    `;
  };

  // ─────────────────────────────────────────────────────────────
  // 3. ฟังก์ชันสั่งพิมพ์ (Print PDF - ไม่เอาปุ่มใดๆ ทั้งสิ้น)
  // ─────────────────────────────────────────────────────────────
  const printToPDF = async () => {
    if (!job) return;
    if (!isCompleted && !isIntake) {
      showAlert(
        'ไม่สามารถพิมพ์ได้',
        'การพิมพ์ใบรับซ่อมสามารถพิมพ์ได้เฉพาะสถานะ "รอตรวจเช็ค" และการพิมพ์ใบเสร็จสามารถพิมพ์ได้เฉพาะสถานะ "เสร็จสิ้น" เท่านั้น',
        'warning'
      );
      return;
    }
    try {
      setIsPrinting(true);
      const html = isCompleted
        ? generateReceiptHtml(job, subtotal, vat, grandTotal)
        : generateIntakeSlipHtml(job);

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document || iframe.contentDocument;
        if (doc) {
          doc.open();
          doc.write(html);
          doc.close();
          iframe.contentWindow?.focus();
          setTimeout(() => {
            iframe.contentWindow?.print();
            setTimeout(() => {
              try {
                document.body.removeChild(iframe);
              } catch {}
            }, 1000);
          }, 300);
        }
        return;
      }

      await Print.printAsync({ html });
    } catch (err: any) {
      showAlert('การพิมพ์ขัดข้อง', err.message || 'ไม่สามารถพิมพ์ได้ในขณะนี้', 'danger');
    } finally {
      setIsPrinting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 4. ฟังก์ชันส่งออก / บันทึกไฟล์ PDF
  // ─────────────────────────────────────────────────────────────
  const exportAndSharePDF = async () => {
    if (!job) return;
    if (!isCompleted && !isIntake) {
      showAlert(
        'ไม่สามารถสร้าง PDF ได้',
        'การพิมพ์ใบรับซ่อมสามารถพิมพ์ได้เฉพาะสถานะ "รอตรวจเช็ค" และการพิมพ์ใบเสร็จสามารถพิมพ์ได้เฉพาะสถานะ "เสร็จสิ้น" เท่านั้น',
        'warning'
      );
      return;
    }
    try {
      setIsPrinting(true);
      const html = isCompleted
        ? generateReceiptHtml(job, subtotal, vat, grandTotal)
        : generateIntakeSlipHtml(job);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
      } else {
        showAlert('สร้างไฟล์ PDF สำเร็จ', `บันทึกไฟล์เรียบร้อยแล้วที่:\n${uri}`, 'success');
      }
    } catch (err: any) {
      showAlert('ส่งออกไม่สำเร็จ', err.message || 'ไม่สามารถสร้างไฟล์ PDF ได้', 'danger');
    } finally {
      setIsPrinting(false);
    }
  };

  const shareAsText = async () => {
    if (!job) return;
    if (!isCompleted && !isIntake) {
      showAlert(
        'ไม่สามารถแชร์ได้',
        'สามารถแชร์ใบรับซ่อมได้เฉพาะสถานะ "รอตรวจเช็ค" และใบเสร็จรับเงินได้เฉพาะสถานะ "เสร็จสิ้น" เท่านั้น',
        'warning'
      );
      return;
    }
    try {
      const message = isCompleted
        ? `IT VERTEX ใบเสร็จรับเงิน\nเลขที่: ${job.job_number}\nลูกค้า: ${job.customer_name}\nอุปกรณ์: ${job.device_type} ${job.brand} ${job.model}\nยอดชำระสุทธิ: ${formatNumber(grandTotal)} บาท`
        : `IT VERTEX ใบรับซ่อมอุปกรณ์\nเลขที่: ${job.job_number}\nลูกค้า: ${job.customer_name}\nอุปกรณ์: ${job.device_type} ${job.brand} ${job.model}\nอาการ: ${job.symptoms}\nวันที่รับ: ${formatDate(job.created_at)}`;
      await Share.share({ message });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 justify-center items-center bg-slate-50">
          <ActivityIndicator size="large" color="#D32F2F" />
          <Text className="mt-4 text-slate-500 text-base">กำลังโหลดข้อมูลเอกสาร...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-1 justify-center items-center bg-slate-50">
          <Ionicons name="document-text-outline" size={60} color="#cbd5e1" />
          <Text className="mt-4 text-slate-500 text-base">ไม่พบข้อมูลงานซ่อม</Text>
          <TouchableOpacity
            className="mt-4 px-6 py-2.5 rounded-xl border border-[#D32F2F]"
            onPress={() => router.back()}
          >
            <Text className="text-[#D32F2F] font-bold">กลับ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // หากสถานะไม่ใช่ "รอตรวจเช็ค" (1) และไม่ใช่ "เสร็จสิ้น" (8) ให้แสดงหน้าแจ้งเตือนเงื่อนไข
  if (!isSupportedDocument) {
    return (
      <SafeAreaView className="flex-1 bg-slate-100">
        <Stack.Screen options={{ headerShown: false }} />
        <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

        {/* Header Bar */}
        <View
          className="flex-row items-center justify-between px-4 pb-4 bg-[#DC2626]"
          style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12 }}
        >
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <Ionicons name="chevron-back" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-white font-heading">เอกสารงานซ่อม</Text>
          <View className="w-8" />
        </View>

        <View className="flex-1 justify-center items-center px-6 py-8">
          <View className="w-20 h-20 rounded-full bg-amber-100 items-center justify-center mb-5 border border-amber-200 shadow-sm">
            <Ionicons name="lock-closed" size={40} color="#D97706" />
          </View>

          <Text className="text-xl font-black text-slate-800 text-center font-heading mb-2">
            ไม่สามารถพิมพ์เอกสารในสถานะนี้ได้
          </Text>
          <Text className="text-sm text-slate-500 text-center font-body mb-6">
            ระบบกำหนดเงื่อนไขการพิมพ์และออกเอกสารตามสถานะงานซ่อม
          </Text>

          <View className="bg-white rounded-2xl p-5 w-full border border-slate-200 shadow-sm mb-6">
            <View className="flex-row items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <Text className="text-xs text-slate-500 font-body">เลขที่งานซ่อม:</Text>
              <Text className="text-sm font-bold text-slate-800 font-heading">{job.job_number}</Text>
            </View>

            <View className="flex-row items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <Text className="text-xs text-slate-500 font-body">สถานะปัจจุบัน:</Text>
              <View className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200">
                <Text className="text-xs font-extrabold text-amber-700 font-heading">
                  {job.status || 'กำลังดำเนินการ'}
                </Text>
              </View>
            </View>

            <Text className="text-xs font-bold text-slate-700 font-heading mb-2">
              📋 เงื่อนไขการพิมพ์เอกสาร:
            </Text>
            <View className="space-y-2 bg-slate-50 rounded-xl p-3 border border-slate-100">
              <Text className="text-xs text-slate-600 font-body leading-5">
                • <Text className="font-bold text-slate-800">ใบรับซ่อม (PDF):</Text> พิมพ์ได้เฉพาะสถานะ <Text className="font-bold text-[#DC2626]">"รอตรวจเช็ค"</Text> เท่านั้น
              </Text>
              <Text className="text-xs text-slate-600 font-body leading-5">
                • <Text className="font-bold text-slate-800">ใบเสร็จรับเงิน (PDF):</Text> พิมพ์ได้เฉพาะสถานะ <Text className="font-bold text-emerald-600">"เสร็จสิ้น"</Text> เท่านั้น
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="w-full bg-slate-800 py-3.5 rounded-2xl items-center justify-center shadow-sm active:bg-slate-900"
            onPress={() => router.back()}
          >
            <Text className="text-white font-bold font-heading text-sm">ย้อนกลับ</Text>
          </TouchableOpacity>
        </View>

        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          onConfirm={() => {
            setAlertConfig((prev) => ({ ...prev, visible: false }));
            alertConfig.onConfirm?.();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-100">
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor="#DC2626" />

      {/* Header Bar */}
      <View
        className="flex-row items-center justify-between px-4 pb-4 bg-[#DC2626]"
        style={{ paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12 }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="chevron-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white font-heading">
          {isCompleted ? 'ใบเสร็จรับเงิน' : 'ใบรับซ่อมอุปกรณ์'}
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
        {/* Document Card */}
        <View className="bg-white rounded-3xl p-5 w-full shadow-sm border border-slate-200 mb-5 relative overflow-hidden">
          {/* PAID Stamp (แสดงเฉพาะเมื่อเสร็จสิ้นเท่านั้น) */}
          {isCompleted && (
            <View className="absolute top-4 right-4 z-10">
              <View className="border-2 border-emerald-600 rounded-xl px-2.5 py-1 items-center bg-emerald-50 -rotate-12 shadow-sm">
                <Text className="text-emerald-700 text-sm font-extrabold tracking-widest font-heading">PAID</Text>
                <Text className="text-emerald-600 text-[10px] font-bold font-body">ชำระแล้ว</Text>
              </View>
            </View>
          )}

          {/* Shop Header */}
          <View className="items-center mb-2 pt-2">
            <Text className="text-2xl font-black text-[#DC2626] font-heading">IT VERTEX</Text>
            <Text className="text-xs text-slate-500 text-center font-body mt-0.5">
              ศูนย์บริการซ่อมคอมพิวเตอร์และอุปกรณ์ไอทีครบวงจร
            </Text>
            <View className="mt-2 px-3 py-0.5 rounded-full bg-slate-100 border border-slate-200">
              <Text className="text-[11px] font-bold text-slate-600 font-heading">
                {isCompleted ? 'ใบเสร็จรับเงิน (RECEIPT)' : 'ใบรับซ่อมอุปกรณ์ (REPAIR INTAKE)'}
              </Text>
            </View>
          </View>

          <View className="border-t border-dashed border-slate-200 my-3.5 w-full" />

          {/* Job Number & Date */}
          <View className="flex-row justify-between px-1">
            <View>
              <Text className="text-[11px] text-slate-400 mb-0.5 font-body">
                {isCompleted ? 'เลขที่ใบเสร็จ / งานซ่อม' : 'เลขที่ใบรับซ่อม'}
              </Text>
              <Text className="text-sm font-bold text-slate-800 font-heading">{job.job_number || '-'}</Text>
            </View>
            <View className="items-end">
              <Text className="text-[11px] text-slate-400 mb-0.5 font-body">วันที่รับเครื่อง</Text>
              <Text className="text-sm font-semibold text-slate-800 font-body">{formatDate(job.created_at)}</Text>
            </View>
          </View>

          <View className="border-t border-dashed border-slate-200 my-3.5 w-full" />

          {/* Customer Information */}
          <View className="px-1">
            <Text className="text-xs font-bold text-[#DC2626] uppercase mb-2 font-heading tracking-wide">
              ข้อมูลลูกค้า (Customer)
            </Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1 font-body">
              <Text className="text-slate-400 font-medium">ชื่อลูกค้า:</Text> {job.customer_name || '-'}
            </Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1 font-body">
              <Text className="text-slate-400 font-medium">เบอร์โทรศัพท์:</Text> {job.phone || '-'}
            </Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1 font-body">
              <Text className="text-slate-400 font-medium">อีเมล:</Text> {job.email || '-'}
            </Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1 font-body">
              <Text className="text-slate-400 font-medium">เจ้าหน้าที่ผู้รับเครื่อง:</Text> {job.received_by || '-'}
            </Text>
          </View>

          <View className="border-t border-dashed border-slate-200 my-3.5 w-full" />

          {/* Device & Intake Details (ตรงตามหน้ารับเครื่องซ่อม) */}
          <View className="px-1">
            <Text className="text-xs font-bold text-[#DC2626] uppercase mb-2 font-heading tracking-wide">
              ข้อมูลอุปกรณ์และสเปกเครื่อง
            </Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1 font-body">
              <Text className="text-slate-400 font-medium">ประเภทอุปกรณ์:</Text> {job.device_type || '-'}
            </Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1 font-body">
              <Text className="text-slate-400 font-medium">ยี่ห้อ / แบรนด์:</Text> {job.brand || '-'}
            </Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1 font-body">
              <Text className="text-slate-400 font-medium">รุ่น / สเปกเครื่อง:</Text> {job.model || '-'}
            </Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1 font-body">
              <Text className="text-slate-400 font-medium">หมายเลข S/N:</Text> {job.serial_number || '-'}
            </Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1 font-body">
              <Text className="text-slate-400 font-medium">อุปกรณ์ที่นำมาด้วย:</Text> {job.accessories || '-'}
            </Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1 font-body">
              <Text className="text-slate-400 font-medium">โปรแกรม/ข้อมูลสำคัญ:</Text> {job.important_software || '-'}
            </Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1 font-body">
              <Text className="text-slate-400 font-medium">รหัสผ่านเครื่อง (PIN):</Text> {job.device_password || '-'}
            </Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1 font-body">
              <Text className="text-slate-400 font-medium">การรับประกัน:</Text> {job.warranty_info || '-'}
            </Text>
          </View>

          <View className="border-t border-dashed border-slate-200 my-3.5 w-full" />

          {/* Symptoms Details */}
          <View className="px-1">
            <Text className="text-xs font-bold text-[#DC2626] uppercase mb-2 font-heading tracking-wide">
              รายละเอียดอาการแจ้งซ่อม
            </Text>
            <Text className="text-[13px] text-slate-700 leading-5 mb-1 font-body">
              <Text className="text-slate-400 font-medium">อาการที่แจ้งซ่อม:</Text> {job.symptoms || '-'}
            </Text>
            {job.actual_symptom && job.actual_symptom !== '-' && (
              <Text className="text-[13px] text-slate-700 leading-5 mb-1 font-body">
                <Text className="text-slate-400 font-medium">อาการตรวจพบจริง:</Text> {job.actual_symptom}
              </Text>
            )}
          </View>

          {/* ── ส่วนการชำระเงิน & ตารางราคา (แสดงเฉพาะเมื่อเสร็จสิ้นเท่านั้น) ── */}
          {isCompleted && (
            <>
              <View className="border-t border-dashed border-slate-200 my-3.5 w-full" />

              {/* Payment Details */}
              <View className="px-1">
                <Text className="text-xs font-bold text-[#DC2626] uppercase mb-2 font-heading tracking-wide">
                  ข้อมูลการชำระเงิน
                </Text>
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-[13px] text-slate-500 font-body">ช่องทางชำระ:</Text>
                  <Text className="text-[13px] font-semibold text-slate-800 font-body">
                    {job.payment_method_name || 'โอนเงิน / สแกน QR'}
                  </Text>
                </View>
                <View className="flex-row justify-between items-center mb-1">
                  <Text className="text-[13px] text-slate-500 font-body">วันที่ชำระเงิน:</Text>
                  <Text className="text-[13px] font-semibold text-slate-800 font-body">
                    {formatDate(job.payment_date) !== '-' ? formatDate(job.payment_date) : 'ชำระเรียบร้อยแล้ว'}
                  </Text>
                </View>
              </View>

              <View className="border-t border-dashed border-slate-200 my-3.5 w-full" />

              {/* Items Table */}
              <View className="px-1">
                <View className="flex-row items-center justify-between mb-2.5">
                  <Text className="text-xs font-bold text-[#DC2626] uppercase font-heading tracking-wide">
                    {isCancelled ? 'รายการค่าบริการ (ยกเลิกซ่อม)' : 'รายการอะไหล่ & บริการ'}
                  </Text>
                  {isCancelled && (
                    <View className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200">
                      <Text className="text-[10px] font-bold text-amber-700 font-heading">
                        ขอยกเลิกซ่อม
                      </Text>
                    </View>
                  )}
                </View>
                {items.length > 0 ? (
                  items.map((item: any, i: number) => {
                    const isService = item.item_type_id === 2 || !item.item_id;
                    const qty = Number(item.quantity || item.qty || 1);
                    const price = Number(item.price || item.unit_price || 0);
                    const lineTotal = Number(item.total_price) || qty * price;

                    return (
                      <View key={i} className="flex-row justify-between items-center mb-2.5 pb-1 border-b border-slate-50">
                        <View className="flex-1 pr-2">
                          <View className="flex-row items-center gap-1.5">
                            <Text className="text-[13px] font-medium text-slate-800 font-body">
                              {i + 1}. {item.name || item.item_name || 'รายการ'}
                            </Text>
                            <View
                              className={`px-1.5 py-0.5 rounded ${
                                isService ? 'bg-sky-50 border border-sky-200' : 'bg-red-50 border border-red-200'
                              }`}
                            >
                              <Text className={`text-[9px] font-bold ${isService ? 'text-sky-600' : 'text-red-600'}`}>
                                {isCancelled ? 'ค่าตรวจเช็ค' : (isService ? 'บริการ' : 'อะไหล่')}
                              </Text>
                            </View>
                          </View>
                          <Text className="text-[11px] text-slate-400 font-body mt-0.5">
                            จำนวน {qty} รายการ @ ฿{formatNumber(price)}
                          </Text>
                        </View>
                        <Text className="text-[13px] font-bold text-slate-800 font-heading">
                          ฿{formatNumber(lineTotal)}
                        </Text>
                      </View>
                    );
                  })
                ) : (
                  <Text className="text-slate-400 text-[13px] text-center py-3 font-body">ไม่มีรายการ</Text>
                )}
              </View>

              <View className="border-t border-dashed border-slate-200 my-3.5 w-full" />

              {/* Totals */}
              <View className="px-1">
                <View className="flex-row justify-between items-center my-1">
                  <Text className="text-[13px] text-slate-500 font-body">รวมเป็นเงิน (Subtotal)</Text>
                  <Text className="text-[13px] font-medium text-slate-800 font-heading">
                    {formatNumber(subtotal)} บาท
                  </Text>
                </View>
                <View className="flex-row justify-between items-center my-1">
                  <Text className="text-[13px] text-slate-500 font-body">ภาษีมูลค่าเพิ่ม (VAT 7% Included)</Text>
                  <Text className="text-[13px] font-medium text-slate-800 font-heading">
                    {formatNumber(vat)} บาท
                  </Text>
                </View>
                <View className="flex-row justify-between items-center bg-red-50 p-3.5 rounded-2xl mt-2 border border-red-100">
                  <View>
                    <Text className="text-[15px] font-extrabold text-[#DC2626] font-heading">
                      {isCancelled ? 'ยอดชำระสุทธิ (ค่าตรวจเช็ค)' : 'ยอดชำระสุทธิ'}
                    </Text>
                    {isCancelled && (
                      <Text className="text-[10px] text-amber-700 font-body">
                        * ชำระเฉพาะค่าตรวจเช็คตามเงื่อนไขการยกเลิกซ่อม
                      </Text>
                    )}
                  </View>
                  <Text className="text-xl font-black text-[#DC2626] font-heading">
                    {formatNumber(grandTotal)} บาท
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* ── ข้อตกลงสำหรับใบรับซ่อม ── */}
          {isIntake && (
            <View className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <Text className="text-[11px] font-bold text-slate-600 mb-1 font-heading">
                ข้อตกลงและเงื่อนไขการรับซ่อม:
              </Text>
              <Text className="text-[10.5px] text-slate-500 leading-4 font-body">
                1. กรุณานำใบรับซ่อมนี้มาแสดงเป็นหลักฐานในการติดต่อรับเครื่องคืน{'\n'}
                2. ทางศูนย์บริการจะตรวจเช็คและแจ้งประเมินราคาให้ลูกค้าอนุมัติก่อนเริ่มซ่อม{'\n'}
                3. กรุณาสำรองข้อมูลสำคัญก่อนส่งซ่อม ทางร้านขอสงวนสิทธิ์ไม่รับผิดชอบต่อข้อมูลที่สูญหาย
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons (ไม่พิมพ์ตอนสั่ง Print) */}
        <View className="w-full gap-3 pb-8">
          {/* พิมพ์ใบรับซ่อม / ใบเสร็จ */}
          <TouchableOpacity
            className="bg-[#DC2626] h-12 rounded-2xl items-center flex-row justify-center shadow-sm active:opacity-90"
            onPress={printToPDF}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />
            ) : (
              <Ionicons name="print-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
            )}
            <Text className="text-white text-sm font-bold font-heading">
              {isCompleted ? 'พิมพ์ใบเสร็จรับเงิน (Print PDF)' : 'พิมพ์ใบรับซ่อม (Print PDF)'}
            </Text>
          </TouchableOpacity>

          {/* บันทึก / ส่งออก PDF */}
          <TouchableOpacity
            className="bg-slate-800 h-12 rounded-2xl items-center flex-row justify-center shadow-sm active:bg-slate-900"
            onPress={exportAndSharePDF}
            disabled={isPrinting}
          >
            <Ionicons name="document-text-outline" size={19} color="#fff" style={{ marginRight: 8 }} />
            <Text className="text-white text-sm font-bold font-heading">
              {isCompleted ? 'ส่งออก / บันทึกใบเสร็จ (PDF)' : 'ส่งออก / บันทึกใบรับซ่อม (PDF)'}
            </Text>
          </TouchableOpacity>

          {/* แชร์ข้อความสรุป */}
          <TouchableOpacity
            className="bg-slate-200 h-11 rounded-2xl items-center flex-row justify-center active:bg-slate-300"
            onPress={shareAsText}
          >
            <Ionicons name="share-outline" size={18} color="#334155" style={{ marginRight: 6 }} />
            <Text className="text-slate-700 text-sm font-bold font-heading">
              {isCompleted ? 'แชร์สรุปใบเสร็จ' : 'แชร์สรุปใบรับซ่อม'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={() => {
          setAlertConfig((prev) => ({ ...prev, visible: false }));
          alertConfig.onConfirm?.();
        }}
      />
    </SafeAreaView>
  );
}
